import "server-only";
import { isEmailInDomains } from "@inbeat/core/email";
import { AppError, isAppError } from "@inbeat/core/errors";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Person } from "@/db/schema";
import { env } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes";
import { authorizeMember, type Viewer } from "./auth";
import { getVerifiedIdentity, type VerifiedIdentity } from "./clerk-identity";
import { logger } from "./logger";
import {
  claimPerson,
  findPersonByClerkUserId,
  findPersonByEmail,
  hasGameForPlayerEmail,
  insertPerson,
  linkPersonToGamesByEmail,
} from "./person-records";

export type ViewerPerson = Viewer & { person: Person };

/** The signed-in viewer with their `people` row; a viewer who may not join sees "not on the list". */
export const getViewerPerson = cache(async (): Promise<ViewerPerson> => {
  const viewer = await authorizeMember();
  try {
    return { ...viewer, person: await syncViewerPerson(viewer.userId) };
  } catch (err) {
    if (isAppError(err, "forbidden")) redirect(ROUTES.notOnTheList);
    throw err;
  }
});

/** Finds the viewer's row, or links or creates it on first sign-in. */
export async function syncViewerPerson(clerkUserId: string): Promise<Person> {
  return (await findPersonByClerkUserId(clerkUserId)) ?? (await linkOrCreatePerson(clerkUserId));
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
  if (!existing && !(await mayJoin(identity))) {
    throw new AppError("forbidden", "email is not on the list");
  }

  const person = existing
    ? await claimPerson(existing.id, clerkUserId, identity.imageUrl)
    : await insertPerson({ clerkUserId, ...identity });
  if (!person) {
    // A concurrent request for the same user won the claim or insert.
    const raced = await findPersonByClerkUserId(clerkUserId);
    if (raced) return raced;
    throw new AppError("conflict", "person row claimed by another clerk user");
  }

  const games = await linkPersonToGamesByEmail(person.id, identity.email);
  logger.info(existing ? "person linked" : "person created", {
    personId: person.id,
    clerkUserId,
    gameIds: games.map((game) => game.id),
  });
  return person;
}

/** Company domains, plus anyone an admin invited as a new hire. Pre-created rows never get here. */
async function mayJoin({ email }: VerifiedIdentity) {
  return isEmailInDomains(email, env.ALLOWED_EMAIL_DOMAINS) || hasGameForPlayerEmail(email);
}
