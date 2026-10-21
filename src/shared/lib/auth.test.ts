import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth }));

import { authorizeAdmin, authorizeMember } from "./auth";

const signedIn = (sessionClaims: unknown) => ({
  isAuthenticated: true,
  userId: "user_1",
  sessionClaims,
});

beforeEach(() => auth.mockReset());

describe("authorizeMember", () => {
  it("rejects a visitor without a session", async () => {
    auth.mockResolvedValue({ isAuthenticated: false, userId: null, sessionClaims: null });
    await expect(authorizeMember()).rejects.toSatisfy((err) => isAppError(err, "auth"));
  });

  it("returns a member when the role claim is missing", async () => {
    auth.mockResolvedValue(signedIn({}));
    await expect(authorizeMember()).resolves.toEqual({ userId: "user_1", role: "member" });
  });

  it("returns an admin for the admin role claim", async () => {
    auth.mockResolvedValue(signedIn({ metadata: { role: "admin" } }));
    await expect(authorizeMember()).resolves.toEqual({ userId: "user_1", role: "admin" });
  });
});

describe("authorizeAdmin", () => {
  it("rejects a visitor without a session", async () => {
    auth.mockResolvedValue({ isAuthenticated: false, userId: null, sessionClaims: null });
    await expect(authorizeAdmin()).rejects.toSatisfy((err) => isAppError(err, "auth"));
  });

  it.each([{}, { metadata: { role: "member" } }, { metadata: { role: "superadmin" } }])(
    "forbids a member (%j)",
    async (claims) => {
      auth.mockResolvedValue(signedIn(claims));
      await expect(authorizeAdmin()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    },
  );

  it("returns the admin viewer", async () => {
    auth.mockResolvedValue(signedIn({ metadata: { role: "admin" } }));
    await expect(authorizeAdmin()).resolves.toEqual({ userId: "user_1", role: "admin" });
  });
});
