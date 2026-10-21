import "server-only";
import { AppError } from "@inbeat/core/errors";
import { cache } from "react";
import { authorizeMember, type Viewer } from "./auth";
import { getVerifiedIdentity } from "./clerk-identity";
import { logger } from "./logger";
import {
  claimPerson,
  findPersonByClerkUserId,
  findPersonByEmail,
  insertPerson,
  linkPlayerGames,
  type Person,
} from "./person-records";

export type ViewerPerson = Viewer & { person: Person };

/** The signed-in viewer with their `people` row, created or linked on first sight. */
export const getViewerPerson = cache(async (): Promise<ViewerPerson> => {
  const viewer = await authorizeMember();
  return { ...viewer, person: await syncViewerPerson(viewer.userId) };
});

export async function syncViewerPerson(clerkUserId: string): Promise<Person> {
  const person =
    (await findPersonByClerkUserId(clerkUserId)) ?? (await linkOrCreatePerson(clerkUserId));
  const linked = await linkPlayerGames(person);
  if (linked.length > 0) {
    logger.info("player linked to games", {
      personId: person.id,
      gameIds: linked.map((g) => g.id),
    });
  }
  return person;
}

async function linkOrCreatePerson(clerkUserId: string): Promise<Person> {
  const identity = await getVerifiedIdentity(clerkUserId);
  const existing = await findPersonByEmail(identity.email);

  if (existing?.clerkUserId === clerkUserId) return existing;
  if (existing?.clerkUserId) {
    // Never move a row to a new Clerk user: an admin clears clerk_user_id to allow it.
    throw new AppError("forbidden", "email already linked to another clerk user", {
      reportToSentry: true,
    });
  }

  const person = existing
    ? await claimPerson(existing.id, clerkUserId)
    : await insertPerson({ clerkUserId, ...identity });
  if (person) {
    logger.info(existing ? "person linked" : "person created", {
      personId: person.id,
      clerkUserId,
    });
    return person;
  }

  // A concurrent request for the same user won the claim or insert.
  const raced = await findPersonByClerkUserId(clerkUserId);
  if (raced) return raced;
  throw new AppError("conflict", "person row claimed by another clerk user");
}
