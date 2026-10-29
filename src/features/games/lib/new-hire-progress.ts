import type { Game } from "../types";
import { addDays, GAME_DAYS, gameDay, isPastReveal, todayInGameZone } from "./game-schedule";
import { describeActivity } from "./relative-time";

type GameTiming = Pick<Game, "status" | "startDate">;

const DAY_AND_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const atNoonUtc = (date: string) => new Date(`${date}T12:00:00Z`);

export type NewHirePhase = "playing" | "upcoming" | "done";

/** An active game that ran past day 14 is done even before the first read marks it revealed. */
export function gamePhase({ status, startDate }: GameTiming, now: Date): NewHirePhase {
  if (status !== "active" || isPastReveal(startDate, now)) return "done";
  return gameDay(startDate, now) < 1 ? "upcoming" : "playing";
}

export const hasStarted = (startDate: string, now: Date) => gameDay(startDate, now) >= 1;

/** Before day 1 a game can always change; once it plays, only until the new hire signs in. */
export function canEditNewHire(
  game: GameTiming & Pick<Game, "playerPersonId">,
  now: Date,
): boolean {
  return (
    gamePhase(game, now) !== "done" &&
    (game.playerPersonId === null || !hasStarted(game.startDate, now))
  );
}

/** The email can be fixed until the new hire signs in with it. */
export const canEditEmail = (game: Pick<Game, "playerPersonId">) => game.playerPersonId === null;

/** From day 2 a player who has not signed in is likely on the wrong email. */
export function missingSignIn(game: GameTiming & Pick<Game, "playerPersonId">, now: Date) {
  return (
    game.playerPersonId === null &&
    gamePhase(game, now) === "playing" &&
    gameDay(game.startDate, now) >= 2
  );
}

export type NewHireStatus = { label: string; tone: "dark" | "default" | "found" | "soft" };

export function newHireStatus(game: GameTiming & Pick<Game, "foundAt">, now: Date): NewHireStatus {
  const phase = gamePhase(game, now);
  if (phase === "playing") {
    return { label: `Day ${gameDay(game.startDate, now)} of ${GAME_DAYS}`, tone: "dark" };
  }
  if (phase === "upcoming") {
    return { label: `Starts ${DAY_AND_DATE.format(atNoonUtc(game.startDate))}`, tone: "default" };
  }
  if (game.status === "found") {
    return {
      label: game.foundAt ? `Found on day ${gameDay(game.startDate, game.foundAt)}` : "Found",
      tone: "found",
    };
  }
  return { label: `Revealed on day ${GAME_DAYS}`, tone: "soft" };
}

export type PlayerProgress = {
  /** The sticker count: "12 stickers". */
  label: string;
  /** When they last did something: "Active 3 hours ago". */
  activity: string;
};

type ProgressInput = { collected: number; lastActiveAt: Date | null; now: Date };

/** How far the new hire got: stickers collected and when they last played. */
export function summarizeProgress({ collected, lastActiveAt, now }: ProgressInput): PlayerProgress {
  return {
    label: `${collected} ${collected === 1 ? "sticker" : "stickers"}`,
    activity: describeActivity(lastActiveAt, now),
  };
}

const STALLED_AFTER_DAYS = 3;

/** Days since a signed-in player in play last did anything, once it is three or more. */
export function daysWithoutActivity(
  game: GameTiming & Pick<Game, "playerPersonId">,
  lastActiveAt: Date | null,
  now: Date,
): number | null {
  if (game.playerPersonId === null || gamePhase(game, now) !== "playing") return null;
  const since = lastActiveAt ? todayInGameZone(lastActiveAt) : game.startDate;
  const days = gameDay(since, now) - 1;
  return days >= STALLED_AFTER_DAYS ? days : null;
}

const MONDAY = 1;
const DAYS_IN_WEEK = 7;

/** The first Monday after a date (YYYY-MM-DD): the usual first day. */
export function nextMonday(date: string): string {
  const weekday = atNoonUtc(date).getUTCDay();
  return addDays(date, ((MONDAY - weekday + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK) + 1);
}

/** A random option other than the selected one, for "pick another at random". */
export function pickAnotherWelcomer<T extends { id: string }>(
  options: readonly T[],
  selectedId: string,
  random: () => number = Math.random,
): T | undefined {
  const others = options.filter(({ id }) => id !== selectedId);
  return others[Math.floor(random() * others.length)];
}
