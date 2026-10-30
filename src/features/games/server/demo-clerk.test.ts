import { describe, expect, it, vi } from "vitest";
import { DEMO_PERSONAS } from "./demo-cast";
import { clerkUserBody, ensureClerkUsers, isClerkTestKey } from "./demo-clerk";

const persona = (key: string) => {
  const found = DEMO_PERSONAS.find((candidate) => candidate.key === key);
  if (!found) throw new Error(`no persona ${key}`);
  return found;
};

describe("isClerkTestKey", () => {
  it("accepts only a development secret key", () => {
    expect(isClerkTestKey("sk_test_abc")).toBe(true);
    expect(isClerkTestKey("sk_live_abc")).toBe(false);
    expect(isClerkTestKey(undefined)).toBe(false);
  });
});

describe("clerkUserBody", () => {
  it("makes a verified-by-API user with no password and the persona's name", () => {
    expect(clerkUserBody(persona("player"))).toEqual({
      email_address: ["player+clerk_test@inbeat.agency"],
      first_name: "Paul",
      last_name: "Player",
      skip_password_requirement: true,
    });
  });

  it("gives the admin role to the admin persona only", () => {
    expect(clerkUserBody(persona("admin"))).toMatchObject({ public_metadata: { role: "admin" } });
    for (const { key } of DEMO_PERSONAS.filter(({ key }) => key !== "admin")) {
      expect(clerkUserBody(persona(key))).not.toHaveProperty("public_metadata");
    }
  });
});

describe("ensureClerkUsers", () => {
  const existing = new Map([["teammate+clerk_test@inbeat.agency", "user_existing"]]);

  const fakeClerk = () => {
    const calls: { path: string; method: string; body?: unknown }[] = [];
    let next = 0;
    const clerk = vi.fn(async (path: string, init?: { method?: string; body?: string }) => {
      const method = init?.method ?? "GET";
      calls.push({ path, method, body: init?.body ? JSON.parse(init.body) : undefined });
      if (method === "GET") {
        const email = decodeURIComponent(path.split("email_address=")[1] ?? "");
        const id = existing.get(email);
        return id ? [{ id }] : [];
      }
      if (method === "POST") return { id: `user_new_${++next}` };
      return {};
    });
    return { clerk, calls };
  };

  it("creates the users that are missing and patches the ones that exist, once each", async () => {
    const { clerk, calls } = fakeClerk();
    const result = await ensureClerkUsers(DEMO_PERSONAS, clerk);
    expect(result).toHaveLength(DEMO_PERSONAS.length);
    expect(result.find(({ email }) => email.startsWith("teammate+"))).toEqual({
      email: "teammate+clerk_test@inbeat.agency",
      id: "user_existing",
      action: "updated",
    });
    expect(result.filter(({ action }) => action === "created")).toHaveLength(
      DEMO_PERSONAS.length - 1,
    );
    expect(calls.filter(({ method }) => method === "POST")).toHaveLength(DEMO_PERSONAS.length - 1);
    expect(new Set(result.map(({ id }) => id)).size).toBe(DEMO_PERSONAS.length);
  });

  it("patches an existing user's name, and sets the role only on the admin persona", async () => {
    const adminAndTeammate = DEMO_PERSONAS.filter(
      ({ key }) => key === "admin" || key === "teammate",
    );
    existing.set("admin+clerk_test@inbeat.agency", "user_admin");
    const { clerk, calls } = fakeClerk();
    await ensureClerkUsers(adminAndTeammate, clerk);
    const patches = calls.filter(({ method }) => method === "PATCH");
    expect(patches.find(({ path }) => path === "/users/user_existing")?.body).toEqual({
      first_name: "Terry",
      last_name: "Teammate",
    });
    expect(patches.find(({ path }) => path === "/users/user_admin/metadata")?.body).toEqual({
      public_metadata: { role: "admin" },
    });
    expect(patches.some(({ path }) => path === "/users/user_existing/metadata")).toBe(false);
  });

  it("is idempotent: a second run creates nobody", async () => {
    const ids = new Map<string, string>();
    const clerk = vi.fn(async (path: string, init?: { method?: string; body?: string }) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        const id = ids.get(decodeURIComponent(path.split("email_address=")[1] ?? ""));
        return id ? [{ id }] : [];
      }
      if (method === "POST") {
        const body = JSON.parse(init?.body ?? "{}") as { email_address: string[] };
        const id = `user_${ids.size}`;
        ids.set(body.email_address[0] ?? "", id);
        return { id };
      }
      return {};
    });
    await ensureClerkUsers(DEMO_PERSONAS, clerk);
    const again = await ensureClerkUsers(DEMO_PERSONAS, clerk);
    expect(again.every(({ action }) => action === "updated")).toBe(true);
    expect(ids.size).toBe(DEMO_PERSONAS.length);
  });
});
