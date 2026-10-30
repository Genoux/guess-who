import { GAME_DAYS, gameDay, revealAt } from "@/entities/game-schedule";
import { type MissionPhase, missionPhase } from "@/entities/mission-phase";
import type { Game } from "../types";
import { describeActivity } from "./relative-time";

type MissionGame = Pick<Game, "status" | "startDate" | "foundAt">;

/** An active mission that ran past day 14 is over even before the first read marks it revealed. */
export const missionStateAt = (game: MissionGame | null, now: Date): MissionPhase =>
  missionPhase(game, now);

export type MissionOutcome = { label: string; found: boolean; endedAt: Date };

/** How a finished mission ended: found on a day, or revealed on day 14. */
export function missionOutcome(game: MissionGame): MissionOutcome {
  if (game.status === "found" && game.foundAt) {
    return {
      label: `Found on day ${gameDay(game.startDate, game.foundAt)}`,
      found: true,
      endedAt: game.foundAt,
    };
  }
  return { label: `Revealed on day ${GAME_DAYS}`, found: false, endedAt: revealAt(game.startDate) };
}

export type PlayerProgress = {
  /** The sticker count: "12". */
  label: string;
  /** When they last did something: "3h ago". */
  activity: string;
};

type ProgressInput = { collected: number; lastActiveAt: Date | null; now: Date };

/** How far the player got: stickers collected and when they last played. */
export function summarizeProgress({ collected, lastActiveAt, now }: ProgressInput): PlayerProgress {
  return {
    label: String(collected),
    activity: describeActivity(lastActiveAt, now),
  };
}
