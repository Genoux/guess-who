import "server-only";
import { and, asc, count, desc, eq, gt, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import {
  clues,
  collections,
  games,
  guesses,
  type Person,
  people,
  shortlists,
  teams,
  type WelcomerClue,
  welcomerClues,
} from "@/db/schema";
import { lastExpiredStartDate } from "@/entities/game-schedule";
import { clearNewHire } from "@/shared/lib/clear-new-hire";
import { db } from "@/shared/lib/db";
import type { ClueRow, Collection, Game } from "../types";

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

export async function findGameById(gameId: string): Promise<Game | undefined> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  return game;
}

/** Everyone welcoming a mission that is still running: active and not past its day-14 reveal. */
export async function listActiveWelcomerIds(now: Date): Promise<string[]> {
  const rows = await db
    .select({ welcomerPersonId: games.welcomerPersonId })
    .from(games)
    .where(
      and(
        eq(games.status, "active"),
        isNotNull(games.welcomerPersonId),
        gt(games.startDate, lastExpiredStartDate(now)),
      ),
    );
  return rows.flatMap((row) => (row.welcomerPersonId ? [row.welcomerPersonId] : []));
}

/**
 * Ends every mission past day 14 that nobody has read since: the active-welcomer index holds a
 * welcomer until their game is revealed, so a pick has to free them first.
 */
export async function revealExpiredGames(now: Date): Promise<number> {
  const revealed = await db
    .update(games)
    .set({ status: "revealed" })
    .where(
      and(
        eq(games.status, "active"),
        isNotNull(games.welcomerPersonId),
        lte(games.startDate, lastExpiredStartDate(now)),
      ),
    )
    .returning({ playerPersonId: games.playerPersonId });
  await clearNewHire(revealed.map(({ playerPersonId }) => playerPersonId));
  return revealed.length;
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

export async function listCollections(collectorPersonId: string): Promise<Collection[]> {
  return db.select().from(collections).where(eq(collections.collectorPersonId, collectorPersonId));
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

/** The welcomer's clues 2 to 4 as they were when the game started. */
export async function listGameClues(gameId: string): Promise<ClueRow[]> {
  return db.select().from(clues).where(eq(clues.gameId, gameId)).orderBy(asc(clues.number));
}

/** The clues a teammate wrote for themselves, which follow them from game to game. */
export async function listWelcomerClues(personId: string): Promise<WelcomerClue[]> {
  return db
    .select()
    .from(welcomerClues)
    .where(eq(welcomerClues.personId, personId))
    .orderBy(asc(welcomerClues.number));
}

export async function hasCollected(collectorPersonId: string, personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(eq(collections.collectorPersonId, collectorPersonId), eq(collections.personId, personId)),
    )
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

// The same rule as `isInAlbum`, in SQL, plus the welcomer of the viewer's running mission, who is
// always in the album so the mission stays winnable.
const albumCondition = (viewerPersonId: string, runningWelcomerId: string | null) => {
  const filledCard = and(
    ne(people.id, viewerPersonId),
    eq(people.hidden, false),
    isNotNull(people.teamId),
    sql`btrim(coalesce(${people.ask}, '')) <> ''`,
  );
  return runningWelcomerId ? or(filledCard, eq(people.id, runningWelcomerId)) : filledCard;
};

/** How many stickers the viewer's album holds and how many they collected, without loading it. */
export async function countAlbum(
  viewerPersonId: string,
  runningWelcomerId: string | null,
): Promise<{ collected: number; total: number }> {
  const album = albumCondition(viewerPersonId, runningWelcomerId);
  const [[inAlbum], [collected]] = await Promise.all([
    db.select({ value: count() }).from(people).where(album),
    db
      .select({ value: count() })
      .from(collections)
      .innerJoin(people, eq(collections.personId, people.id))
      .where(and(eq(collections.collectorPersonId, viewerPersonId), album)),
  ]);
  return { collected: collected?.value ?? 0, total: inAlbum?.value ?? 0 };
}
