import type { Clue, Game } from "../types";
import { CLUE_DAYS, CLUE_NUMBERS, type ClueNumber, clueReleaseAt, gameDay } from "./game-schedule";

const NEVER = new Date(0);

/** What the player reads when a clue landed but the welcomer never wrote it. */
export const MISSING_CLUE_TEXT = "Your welcomer kept this one to themselves.";

/**
 * The four clues of a game. Release times come from the schedule, not the rows, so a game
 * without clue rows still has its calendar. Clue 1 is generated from the welcomer's team;
 * clues 2 to 4 are the welcomer's text, null until written.
 */
export function buildGameClues(
  game: Pick<Game, "id" | "startDate">,
  rows: readonly Clue[],
  welcomerTeamName: string | null,
): Clue[] {
  return CLUE_NUMBERS.map((number) => {
    const row = rows.find((clue) => clue.gameId === game.id && clue.number === number);
    const text =
      number === 1
        ? welcomerTeamName
          ? `Works in ${welcomerTeamName}.`
          : null
        : (row?.text ?? null);
    return {
      id: row?.id ?? `${game.id}:${number}`,
      gameId: game.id,
      number,
      text,
      releaseAt: clueReleaseAt(game.startDate, number),
      createdAt: row?.createdAt ?? NEVER,
      updatedAt: row?.updatedAt ?? NEVER,
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
