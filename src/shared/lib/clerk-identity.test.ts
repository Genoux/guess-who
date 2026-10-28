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
  externalAccounts: [] as { provider: string; providerUserId: string; imageUrl?: string }[],
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
      slackUserId: null,
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

  it("prefers the Slack photo over the Clerk picture", async () => {
    getUser.mockResolvedValue({
      ...user("verified", "Maya Chen", { hasImage: true, imageUrl: "https://img.clerk.com/maya" }),
      externalAccounts: [
        { provider: "oauth_slack", providerUserId: "U123", imageUrl: "https://img.slack/maya" },
      ],
    });
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({
      imageUrl: "https://img.slack/maya",
    });
  });

  it("uses the Clerk picture when the Slack account has no photo", async () => {
    getUser.mockResolvedValue({
      ...user("verified", "Maya Chen", { hasImage: true, imageUrl: "https://img.clerk.com/maya" }),
      externalAccounts: [{ provider: "oauth_slack", providerUserId: "U123", imageUrl: "" }],
    });
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({
      imageUrl: "https://img.clerk.com/maya",
    });
  });

  it("has no photo when neither Slack nor Clerk has a real one", async () => {
    getUser.mockResolvedValue({
      ...user("verified"),
      externalAccounts: [{ provider: "oauth_slack", providerUserId: "U123", imageUrl: "" }],
    });
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({ imageUrl: null });
  });

  it.each(["slack", "oauth_slack"])(
    "reads the Slack user id from a %s account",
    async (provider) => {
      getUser.mockResolvedValue({
        ...user("verified"),
        externalAccounts: [
          { provider: "oauth_google", providerUserId: "google_1" },
          { provider, providerUserId: "U123" },
        ],
      });
      await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({ slackUserId: "U123" });
    },
  );

  it("has no Slack user id when only other providers are linked", async () => {
    getUser.mockResolvedValue({
      ...user("verified"),
      externalAccounts: [{ provider: "oauth_google", providerUserId: "google_1" }],
    });
    await expect(getVerifiedIdentity("user_1")).resolves.toMatchObject({ slackUserId: null });
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
