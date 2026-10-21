import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser } }),
}));

import { getVerifiedIdentity } from "./clerk-identity";

const user = (
  status: string | null,
  fullName: string | null = "Maya Chen",
  image: { hasImage: boolean; imageUrl: string } = {
    hasImage: false,
    imageUrl: "https://img.clerk.com/default",
  },
) => ({
  fullName,
  ...image,
  primaryEmailAddress: {
    emailAddress: "  Maya.Chen@InBeat.agency ",
    verification: status ? { status } : null,
  },
});

beforeEach(() => getUser.mockReset());

describe("getVerifiedIdentity", () => {
  it("returns the normalized verified primary email and full name", async () => {
    getUser.mockResolvedValue(user("verified"));
    await expect(getVerifiedIdentity("user_1")).resolves.toEqual({
      email: "maya.chen@inbeat.agency",
      name: "Maya Chen",
      imageUrl: null,
    });
    expect(getUser).toHaveBeenCalledWith("user_1");
  });

  it("keeps a real picture (Slack's) and drops Clerk's generated placeholder", async () => {
    getUser.mockResolvedValue(
      user("verified", "Maya Chen", { hasImage: true, imageUrl: "https://img.clerk.com/maya" }),
    );
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({
      imageUrl: "https://img.clerk.com/maya",
    });
  });

  it("falls back to the email local part when the user has no name", async () => {
    getUser.mockResolvedValue(user("verified", null));
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({ name: "maya.chen" });
  });

  it.each(["unverified", "expired", "transferable", null])(
    "forbids a primary email with verification %s",
    async (status) => {
      getUser.mockResolvedValue(user(status));
      await expect(getVerifiedIdentity("user_1")).rejects.toSatisfy((err) =>
        isAppError(err, "forbidden"),
      );
    },
  );

  it("forbids a user without a primary email", async () => {
    getUser.mockResolvedValue({ fullName: "Maya", primaryEmailAddress: null });
    await expect(getVerifiedIdentity("user_1")).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
  });
});
