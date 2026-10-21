import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { games, type Person, people } from "@/db/schema";
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
export async function claimPerson(personId: string, clerkUserId: string) {
  const [person] = await db
    .update(people)
    .set({ clerkUserId })
    .where(and(eq(people.id, personId), isNull(people.clerkUserId)))
    .returning();
  return person;
}

/**
 * Returns nothing when a concurrent request already inserted the email. Postgres takes one
 * conflict target, so any other unique violation (clerk_user_id, sticker_number) throws.
 */
export async function insertPerson(values: { clerkUserId: string; email: string; name: string }) {
  const [person] = await db
    .insert(people)
    .values(values)
    .onConflictDoNothing({ target: people.email })
    .returning();
  return person;
}

/** Makes the person the player of every unclaimed game created for this (normalized) email. */
export async function linkPersonToGamesByEmail(personId: string, email: string) {
  return db
    .update(games)
    .set({ playerPersonId: personId })
    .where(and(eq(games.playerEmail, email), isNull(games.playerPersonId)))
    .returning({ id: games.id });
}
