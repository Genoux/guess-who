import "server-only";
import { AppError, isAppError, isUniqueViolation } from "@inbeat/core/errors";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Person } from "@/db/schema";
import { ROUTES } from "@/shared/config/routes";
import { authorizeMember, type Viewer } from "./auth";
import { getVerifiedIdentity } from "./clerk-identity";
import { logger } from "./logger";
import {
  claimPerson,
  findPeopleByAnyEmail,
  findPersonByClerkUserId,
  refreshPersonIdentity,
} from "./person-records";

export type ViewerPerson = Viewer & { person: Person };

/** The signed-in viewer with their `people` row; a viewer who is not on the list sees "not on the list". */
export const getViewerPerson = cache(async (): Promise<ViewerPerson> => {
  const viewer = await authorizeMember();
  try {
    return { ...viewer, person: await syncViewerPerson(viewer.userId, viewer.sessionId) };
  } catch (err) {
    if (isAppError(err, "forbidden")) redirect(ROUTES.notOnTheList);
    throw err;
  }
});

/** Finds the viewer's row, re-reading Clerk once per session, or links it on first sign-in. */
export async function syncViewerPerson(clerkUserId: string, sessionId: string): Promise<Person> {
  const person = await findPersonByClerkUserId(clerkUserId);
  if (!person) return linkPerson(clerkUserId, sessionId);
  if (person.syncedSessionId === sessionId) return person;
  return refreshFromClerk(person, clerkUserId, sessionId);
}

// Only the photo and Slack id are refreshed, so a failure (Clerk unreachable, the Slack id already
// on another row) keeps the stored row rather than failing every page of the session.
async function refreshFromClerk(
  person: Person,
  clerkUserId: string,
  sessionId: string,
): Promise<Person> {
  try {
    const { imageUrl, slackUserId } = await getVerifiedIdentity(clerkUserId);
    return (await refreshPersonIdentity(person.id, sessionId, { imageUrl, slackUserId })) ?? person;
  } catch (err) {
    if (isAppError(err, "forbidden")) throw err;
    logger.warn("person refresh failed", { personId: person.id, clerkUserId });
    return person;
  }
}

// The roster comes from Deel, so a sign-in never creates a row: the verified email must match
// exactly one person, on their work or personal email.
async function linkPerson(clerkUserId: string, sessionId: string): Promise<Person> {
  const { email, imageUrl, slackUserId } = await getVerifiedIdentity(clerkUserId);
  const matches = await findPeopleByAnyEmail(email);
  const [match] = matches;
  if (!match || matches.length > 1) throw new AppError("forbidden", "email is not on the list");

  if (match.clerkUserId === clerkUserId) return match;
  if (match.clerkUserId) {
    // Never move a row to a new Clerk user: an admin clears clerk_user_id to allow it.
    throw new AppError("forbidden", "email already linked to another clerk user", {
      reportToSentry: true,
    });
  }

  const claim = (claimedSlackUserId: string | null) =>
    claimPerson(match.id, clerkUserId, sessionId, { imageUrl, slackUserId: claimedSlackUserId });
  // The Slack id is unique: another row holding it must not block the first sign-in.
  const person = await claim(slackUserId).catch((err: unknown) => {
    if (!isUniqueViolation(err)) throw err;
    logger.warn("slack id already on another person", { personId: match.id, clerkUserId });
    return claim(null);
  });
  if (!person) {
    // A concurrent request for the same user won the claim.
    const raced = await findPersonByClerkUserId(clerkUserId);
    if (raced) return raced;
    throw new AppError("conflict", "person row claimed by another clerk user");
  }
  logger.info("person linked", { personId: person.id, clerkUserId });
  return person;
}
