import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { normalizeEmail } from "@inbeat/core/email";
import { AppError } from "@inbeat/core/errors";

export type VerifiedIdentity = {
  email: string;
  name: string;
  imageUrl: string | null;
  slackUserId: string | null;
};

// Clerk docs disagree on the provider string; the API value is passed through unchanged.
const SLACK_PROVIDERS = ["slack", "oauth_slack"];

/** The Clerk user's primary email, only when Clerk has verified it (Slack OAuth does). */
export async function getVerifiedIdentity(clerkUserId: string): Promise<VerifiedIdentity> {
  const user = await (await clerkClient()).users.getUser(clerkUserId);
  const primary = user.primaryEmailAddress;
  if (primary?.verification?.status !== "verified") {
    throw new AppError("forbidden", "primary email is not verified");
  }
  const email = normalizeEmail(primary.emailAddress);
  const slackAccount = user.externalAccounts.find((account) =>
    SLACK_PROVIDERS.includes(account.provider),
  );
  return {
    email,
    name: user.fullName?.trim() || email.split("@")[0] || email,
    // Clerk gives everyone a generated placeholder; keep only a real picture (Slack's, an upload).
    imageUrl: slackAccount?.imageUrl || (user.hasImage ? user.imageUrl : null),
    slackUserId: slackAccount?.providerUserId ?? null,
  };
}
