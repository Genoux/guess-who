import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "./db";

export type Person = typeof people.$inferSelect;

export async function findPersonByClerkUserId(clerkUserId: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.clerkUserId, clerkUserId));
  return person;
}

export async function findPersonByEmail(email: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.email, email));
  return person;
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

/** Returns nothing when the email or Clerk user already has a row (a concurrent request). */
export async function insertPerson(values: { clerkUserId: string; email: string; name: string }) {
  const [person] = await db.insert(people).values(values).onConflictDoNothing().returning();
  return person;
}

/** Makes the person the player of every game created for their email before they signed in. */
export async function linkPlayerGames(person: Pick<Person, "id" | "email">) {
  return db
    .update(games)
    .set({ playerPersonId: person.id })
    .where(and(eq(games.playerEmail, person.email), isNull(games.playerPersonId)))
    .returning({ id: games.id });
}
