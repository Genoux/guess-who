import { isPastReveal } from "./game-schedule";

/** Where a person's mission stands: none, running, or over. */
export type MissionPhase = "none" | "playing" | "over";

type PhaseGame = { status: string; startDate: string };

/**
 * Given `now`, an active mission past day 14 is over even before the first read marks it revealed.
 */
export function missionPhase(game: PhaseGame | null | undefined, now?: Date): MissionPhase {
  if (!game) return "none";
  if (game.status !== "active") return "over";
  return now && isPastReveal(game.startDate, now) ? "over" : "playing";
}
