import "server-only";
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import {
  clues,
  collections,
  games,
  guesses,
  type Person,
  people,
  shortlists,
  teams,
} from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Clue, Collection, Game } from "../types";

const activeFirst = sql`(${games.status} = 'active') desc`;

/** The person's game as player: the active one, else the most recent. */
export async function findLatestPlayerGame(personId: string): Promise<Game | undefined> {
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.playerPersonId, personId))
    .orderBy(activeFirst, desc(games.createdAt))
    .limit(1);
  return game;
}

/** The person's game as welcomer: the active one, else the most recent. */
export async function findLatestWelcomerGame(personId: string): Promise<Game | undefined> {
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.welcomerPersonId, personId))
    .orderBy(activeFirst, desc(games.createdAt))
    .limit(1);
  return game;
}

export async function findPersonById(personId: string): Promise<Person | undefined> {
  const [person] = await db.select().from(people).where(eq(people.id, personId));
  return person;
}

/** Visible people with a team, in sticker order; `isInAlbum` drops unfinished cards. */
export async function listAlbumPeople(): Promise<Person[]> {
  return db
    .select()
    .from(people)
    .where(and(eq(people.hidden, false), isNotNull(people.teamId)))
    .orderBy(asc(people.stickerNumber));
}

export type Team = typeof teams.$inferSelect;

export async function listTeams(): Promise<Team[]> {
  return db.select().from(teams).orderBy(asc(teams.sortOrder), asc(teams.name));
}

export async function listCollections(gameId: string): Promise<Collection[]> {
  return db.select().from(collections).where(eq(collections.gameId, gameId));
}

export async function listShortlistedIds(gameId: string): Promise<string[]> {
  const rows = await db
    .select({ personId: shortlists.personId })
    .from(shortlists)
    .where(eq(shortlists.gameId, gameId));
  return rows.map((row) => row.personId);
}

export async function listGuesses(gameId: string) {
  return db
    .select({ personId: guesses.personId, correct: guesses.correct, createdAt: guesses.createdAt })
    .from(guesses)
    .where(eq(guesses.gameId, gameId));
}

export async function listClueRows(gameId: string): Promise<Clue[]> {
  return db.select().from(clues).where(eq(clues.gameId, gameId)).orderBy(asc(clues.number));
}

export async function hasCollected(gameId: string, personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.gameId, gameId), eq(collections.personId, personId)))
    .limit(1);
  return row !== undefined;
}

export async function hasGuessed(gameId: string, personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: guesses.id })
    .from(guesses)
    .where(and(eq(guesses.gameId, gameId), eq(guesses.personId, personId)))
    .limit(1);
  return row !== undefined;
}
