import {
  CLUE_DAYS,
  CLUE_NUMBERS,
  type ClueNumber,
  clueReleaseAt,
  gameDay,
} from "@/entities/game-schedule";
import type { Clue, ClueRow, Game } from "../types";

const NEVER = new Date(0);

/** Clue 1: generated from the welcomer's team. */
export const teamClueText = (teamName: string | null) =>
  teamName ? `Works in ${teamName}.` : null;

/**
 * The four clues of a game. Release times come from the schedule. Clue 1 is generated from the
 * welcomer's team; clues 2 to 4 are the copy of the welcomer's clues taken at Start.
 */
export function buildGameClues(
  game: Pick<Game, "id" | "startDate">,
  snapshot: readonly Pick<ClueRow, "number" | "text" | "createdAt" | "updatedAt">[],
  welcomerTeamName: string | null,
): Clue[] {
  return CLUE_NUMBERS.map((number) => {
    const own = snapshot.find((clue) => clue.number === number);
    const text = number === 1 ? teamClueText(welcomerTeamName) : (own?.text ?? null);
    return {
      id: `${game.id}:${number}`,
      gameId: game.id,
      number,
      text,
      releaseAt: clueReleaseAt(game.startDate, number),
      createdAt: own?.createdAt ?? NEVER,
      updatedAt: own?.updatedAt ?? NEVER,
    };
  });
}

/** A clue is out on its release time, and every clue is out once the game is over. */
export function isClueOut(releaseAt: Date, game: Pick<Game, "status">, now: Date): boolean {
  return releaseAt <= now || game.status !== "active";
}

type ClueProgress = { number: number; released: boolean };

/** Face down until released, yellow until the player opened it, white after. */
export function clueCardState(clue: ClueProgress, lastReadClue: number): "down" | "new" | "open" {
  if (!clue.released) return "down";
  return clue.number > lastReadClue ? "new" : "open";
}

/** The newest released clue the player has not opened yet. */
export function newestUnreadClue<T extends ClueProgress>(
  clues: readonly T[],
  lastReadClue: number,
): T | null {
  const unread = clues.filter((clue) => clue.released && clue.number > lastReadClue);
  return unread.reduce<T | null>(
    (newest, clue) => (newest && newest.number > clue.number ? newest : clue),
    null,
  );
}

export function clueDay(number: number): number {
  return CLUE_DAYS[number as ClueNumber];
}

/** The next clue still to land and how many days away it is, or null after clue 4. */
export function nextClue(
  startDate: string,
  now: Date,
): { number: ClueNumber; inDays: number } | null {
  const number = CLUE_NUMBERS.find((n) => clueReleaseAt(startDate, n) > now);
  if (!number) return null;
  return { number, inDays: clueUnlocksIn(number, startDate, now) };
}

/** Whole game days until a clue's day; 0 on the day itself, before or after 9:00. */
export function clueUnlocksIn(number: number, startDate: string, now: Date): number {
  return Math.max(0, clueDay(number) - gameDay(startDate, now));
}

export function clueUnlockCopy(inDays: number): string {
  if (inDays <= 0) return "Unlocks today";
  if (inDays === 1) return "Unlocks tomorrow";
  return `Unlocks in ${inDays} days`;
}

/** A clue has landed in a running mission that the player has not opened yet. */
export function hasUnreadClue(
  game: Pick<Game, "status" | "startDate" | "lastReadClue"> | null,
  now: Date,
): boolean {
  if (!game) return false;
  if (game.status !== "active") return false;
  const { startDate } = game;
  return CLUE_NUMBERS.some(
    (number) => number > game.lastReadClue && clueReleaseAt(startDate, number) <= now,
  );
}
