import "server-only";
import type { DEMO_PERSONAS } from "./demo-cast";

type Persona = (typeof DEMO_PERSONAS)[number];

/** A Clerk Backend API call: the path after /v1, and the usual fetch options. */
export type ClerkCall = (
  path: string,
  init?: { method?: string; body?: string },
) => Promise<unknown>;

/** Only a development instance's secret key may create demo users. */
export const isClerkTestKey = (key: string | undefined): key is string =>
  Boolean(key?.startsWith("sk_test_"));

const nameOf = ({ name }: Persona) => {
  const [first = name, ...rest] = name.split(" ");
  return { first_name: first, last_name: rest.join(" ") };
};

/** The body that creates a persona's user: API-created emails come back verified, no password. */
export function clerkUserBody(persona: Persona) {
  return {
    email_address: [persona.email],
    ...nameOf(persona),
    skip_password_requirement: true,
    ...(persona.key === "admin" && { public_metadata: { role: "admin" } }),
  };
}

export type ClerkUserResult = { email: string; id: string; action: "created" | "updated" };

/** Creates the persona users that Clerk lacks and patches the ones it has; safe to run again. */
export async function ensureClerkUsers(
  personas: readonly Persona[],
  clerk: ClerkCall,
): Promise<ClerkUserResult[]> {
  const results: ClerkUserResult[] = [];
  for (const persona of personas) {
    const found = (await clerk(`/users?email_address=${encodeURIComponent(persona.email)}`)) as {
      id: string;
    }[];
    const [user] = found;
    if (!user) {
      const created = (await clerk("/users", {
        method: "POST",
        body: JSON.stringify(clerkUserBody(persona)),
      })) as { id: string };
      results.push({ email: persona.email, id: created.id, action: "created" });
      continue;
    }
    await clerk(`/users/${user.id}`, { method: "PATCH", body: JSON.stringify(nameOf(persona)) });
    if (persona.key === "admin") {
      await clerk(`/users/${user.id}/metadata`, {
        method: "PATCH",
        body: JSON.stringify({ public_metadata: { role: "admin" } }),
      });
    }
    results.push({ email: persona.email, id: user.id, action: "updated" });
  }
  return results;
}

/** The Backend API over fetch, authorized with a development secret key. */
export const clerkApi =
  (secretKey: string): ClerkCall =>
  async (path, init) => {
    const response = await fetch(`https://api.clerk.com/v1${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    });
    if (!response.ok)
      throw new Error(`Clerk ${init?.method ?? "GET"} ${path} answered ${response.status}`);
    return response.json();
  };
