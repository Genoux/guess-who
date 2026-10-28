import "server-only";
import { errorChain, isUniqueViolation } from "@inbeat/core/errors";
import { and, eq, isNull } from "drizzle-orm";
import { games, type Person, people } from "@/db/schema";
import type { VerifiedIdentity } from "./clerk-identity";
import { db } from "./db";

export async function findPersonByClerkUserId(clerkUserId: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.clerkUserId, clerkUserId));
  return person;
}

export async function findPersonByEmail(email: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.email, email));
  return person;
}

export async function hasGameForPlayerEmail(email: string): Promise<boolean> {
  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.playerEmail, email))
    .limit(1);
  return game !== undefined;
}

/** Links an unclaimed row; returns nothing if another Clerk user claimed it first. */
export async function claimPerson(
  personId: string,
  clerkUserId: string,
  syncedSessionId: string,
  { imageUrl, slackUserId }: Pick<VerifiedIdentity, "imageUrl" | "slackUserId">,
) {
  const [person] = await db
    .update(people)
    .set({
      clerkUserId,
      syncedSessionId,
      ...(imageUrl && { imageUrl }),
      ...(slackUserId && { slackUserId }),
    })
    .where(and(eq(people.id, personId), isNull(people.clerkUserId)))
    .returning();
  return person;
}

/** Records the session the row was read from; a photo or Slack id Clerk lacks is never cleared. */
export async function refreshPersonIdentity(
  personId: string,
  syncedSessionId: string,
  { imageUrl, slackUserId }: Pick<VerifiedIdentity, "imageUrl" | "slackUserId">,
) {
  const [person] = await db
    .update(people)
    .set({
      syncedSessionId,
      ...(imageUrl && { imageUrl }),
      ...(slackUserId && { slackUserId }),
    })
    .where(eq(people.id, personId))
    .returning();
  return person;
}

const CLERK_USER_ID_UNIQUE = "people_clerk_user_id_unique";

const violatesConstraint = (err: unknown, constraint: string) =>
  isUniqueViolation(err) &&
  errorChain(err).some(
    (link) => (link as { constraint?: unknown } | null)?.constraint === constraint,
  );

/**
 * Returns nothing when a concurrent request for the same user already inserted the row: Postgres
 * takes one conflict target, so a clerk_user_id race surfaces as an error we treat the same way.
 * Any other unique violation (sticker_number) throws.
 */
export async function insertPerson(values: {
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  slackUserId?: string | null;
  syncedSessionId?: string | null;
}) {
  try {
    const [person] = await db
      .insert(people)
      .values(values)
      .onConflictDoNothing({ target: people.email })
      .returning();
    return person;
  } catch (err) {
    if (violatesConstraint(err, CLERK_USER_ID_UNIQUE)) return undefined;
    throw err;
  }
}

/** Makes the person the player of every unclaimed game created for this (normalized) email. */
export async function linkPersonToGamesByEmail(personId: string, email: string) {
  return db
    .update(games)
    .set({ playerPersonId: personId })
    .where(and(eq(games.playerEmail, email), isNull(games.playerPersonId)))
    .returning({ id: games.id });
}
