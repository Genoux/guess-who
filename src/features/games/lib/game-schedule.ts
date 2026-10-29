// The game calendar. Day 1 is the start date; everything lands at 09:00 Montréal time.

export const GAME_DAYS = 14;
export const GAME_TIME_ZONE = "America/Toronto";
export const RELEASE_HOUR = 9;

/** The welcomer hears about their game on day 2 (phase 6 sends it). */
export const WELCOMER_TOLD_DAY = 2;

export const CLUE_NUMBERS = [1, 2, 3, 4] as const;
export type ClueNumber = (typeof CLUE_NUMBERS)[number];

/** Clue 1 (the welcomer's team) on day 3, then the welcomer's three clues. */
export const CLUE_DAYS: Record<ClueNumber, number> = { 1: 3, 2: 6, 3: 9, 4: 12 };

const DAY_MS = 86_400_000;

function parseDate(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`invalid date: ${date}`);
  return [year, month, day];
}

/** The calendar date `days` after `date` (YYYY-MM-DD). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

const zoneFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: GAME_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Wall-clock parts of an instant in the game time zone. */
function zoneParts(at: Date) {
  const parts = zoneFormat.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** How far the game time zone is ahead of UTC at an instant, in ms (negative in Montréal). */
function zoneOffset(at: Date): number {
  const p = zoneParts(at);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** `hour`:00 on a calendar date in the game time zone, as an instant. */
export function zonedTime(date: string, hour: number): Date {
  const [year, month, day] = parseDate(date);
  const wall = Date.UTC(year, month - 1, day, hour);
  const first = wall - zoneOffset(new Date(wall));
  // A second pass settles dates where the offset changes between the guess and the answer (DST).
  return new Date(wall - zoneOffset(new Date(first)));
}

/** 09:00 on a game day. */
export function releaseAtForDay(startDate: string, day: number): Date {
  return zonedTime(addDays(startDate, day - 1), RELEASE_HOUR);
}

export function clueReleaseAt(startDate: string, number: ClueNumber): Date {
  return releaseAtForDay(startDate, CLUE_DAYS[number]);
}

/** Day 14 at 09:00: an active game ends here and the welcomer is revealed. */
export function revealAt(startDate: string): Date {
  return releaseAtForDay(startDate, GAME_DAYS);
}

export function isPastReveal(startDate: string, now: Date): boolean {
  return now >= revealAt(startDate);
}

/** The calendar date (YYYY-MM-DD) of an instant in the game time zone. */
export function todayInGameZone(now: Date): string {
  const { year, month, day } = zoneParts(now);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** The game day `now` falls on (1 on the start date); 0 or less before the game starts. */
export function gameDay(startDate: string, now: Date): number {
  const p = zoneParts(now);
  const [year, month, day] = parseDate(startDate);
  return (
    Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(year, month - 1, day)) / DAY_MS) + 1
  );
}

/** Whole days until day 14: 8 on day 6, never below 0. */
export function daysLeft(startDate: string, now: Date): number {
  return Math.min(GAME_DAYS, Math.max(0, GAME_DAYS - gameDay(startDate, now)));
}

export function isClueNumber(value: number): value is ClueNumber {
  return (CLUE_NUMBERS as readonly number[]).includes(value);
}
