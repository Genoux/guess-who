import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  NODE_ENV: "development" as string | undefined,
  NEXT_PUBLIC_VERCEL_ENV: undefined as string | undefined,
  DATABASE_URL: "postgres://user:pass@ep-dev-branch.neon.tech/db" as string | undefined,
}));
const { authorizeMember, findPersonByClerkUserId } = vi.hoisted(() => ({
  authorizeMember: vi.fn(),
  findPersonByClerkUserId: vi.fn(),
}));

vi.mock("@/shared/config/env", () => ({ env }));
vi.mock("@/shared/lib/auth", () => ({ authorizeMember }));
vi.mock("@/shared/lib/person-records", () => ({ findPersonByClerkUserId }));

import { authorizeDemoTester } from "./authorize-demo-tester";

beforeEach(() => {
  vi.clearAllMocks();
  env.NODE_ENV = "development";
  env.NEXT_PUBLIC_VERCEL_ENV = undefined;
  env.DATABASE_URL = "postgres://user:pass@ep-dev-branch.neon.tech/db";
  authorizeMember.mockResolvedValue({ userId: "user_1", role: "member" });
  findPersonByClerkUserId.mockResolvedValue({ id: "p_1", email: "tester@inbeat.agency" });
});

describe("authorizeDemoTester", () => {
  it("returns the signed-in tester's email on a dev server", async () => {
    await expect(authorizeDemoTester()).resolves.toEqual({
      userId: "user_1",
      role: "member",
      email: "tester@inbeat.agency",
    });
  });

  it("forbids production deployments", async () => {
    env.NODE_ENV = "production";
    env.NEXT_PUBLIC_VERCEL_ENV = "production";
    const error = await authorizeDemoTester().catch((caught: unknown) => caught);
    expect(isAppError(error) && error.kind).toBe("forbidden");
    expect(authorizeMember).not.toHaveBeenCalled();
  });

  it("refuses the production database even on a dev server", async () => {
    env.DATABASE_URL = "postgres://user:pass@ep-wandering-truth-123.neon.tech/db";
    await expect(authorizeDemoTester()).rejects.toThrow(/production endpoint/);
  });

  it("forbids a viewer without a person row", async () => {
    findPersonByClerkUserId.mockResolvedValue(undefined);
    const error = await authorizeDemoTester().catch((caught: unknown) => caught);
    expect(isAppError(error) && error.kind).toBe("forbidden");
  });
});
