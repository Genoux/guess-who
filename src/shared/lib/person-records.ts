import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { type Person, people } from "@/db/schema";
import type { VerifiedIdentity } from "./clerk-identity";
import { db } from "./db";

export async function findPersonByClerkUserId(clerkUserId: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.clerkUserId, clerkUserId));
  return person;
}

/** At most two rows: one is a match, two is ambiguous. */
export async function findPeopleByAnyEmail(email: string): Promise<Person[]> {
  return db
    .select()
    .from(people)
    .where(or(eq(people.email, email), eq(people.personalEmail, email)))
    .limit(2);
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
