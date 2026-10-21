import { describe, expect, it } from "vitest";
import { resolveRole } from "./roles";

describe("resolveRole", () => {
  it("returns admin only for an exact admin role claim", () => {
    expect(resolveRole({ metadata: { role: "admin" } })).toBe("admin");
  });

  it.each([
    ["no claims", null],
    ["undefined claims", undefined],
    ["no metadata", { sub: "user_1" }],
    ["null metadata", { metadata: null }],
    ["string metadata", { metadata: "admin" }],
    ["missing role", { metadata: {} }],
    ["member role", { metadata: { role: "member" } }],
    ["unknown role", { metadata: { role: "owner" } }],
    ["differently cased admin", { metadata: { role: "Admin" } }],
    ["padded admin", { metadata: { role: " admin" } }],
    ["array role", { metadata: { role: ["admin"] } }],
    ["role at the top level", { role: "admin" }],
  ])("falls back to member for %s", (_label, claims) => {
    expect(resolveRole(claims)).toBe("member");
  });
});
