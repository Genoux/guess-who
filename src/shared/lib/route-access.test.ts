import { describe, expect, it } from "vitest";
import { isAdminPath, isPublicPath } from "./route-access";

describe("isPublicPath", () => {
  it.each([
    "/sign-in",
    "/sign-in/factor-one",
    "/sign-up",
    "/sign-up/verify",
    "/api/health",
    "/robots.txt",
    "/dev/components",
    "/dev/welcome",
    "/dev/album",
    "/dev/mission",
    "/dev/welcomer",
  ])("lets %s through without a session", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/card",
    "/play",
    "/admin",
    "/api/health/deep",
    "/api/healthz",
    "/sign-in-evil",
    "/robots.txt.bak",
    "/dev",
    "/dev/components-evil",
  ])("requires a session for %s", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("isAdminPath", () => {
  it.each(["/admin", "/admin/games", "/admin/people/1"])("gates %s", (path) => {
    expect(isAdminPath(path)).toBe(true);
  });

  it.each(["/", "/card", "/play", "/administrator", "/api/health"])("does not gate %s", (path) => {
    expect(isAdminPath(path)).toBe(false);
  });
});
