import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq, inArray } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { finalizeExpiredGameRecord } from "@/shared/lib/finalize-expired-game-record";
import { findGameById } from "./game-records";

type GameStatus = (typeof games.$inferSelect)["status"];

/** Where the admin saw the mission: End mission on a running one, Reset on a finished one. */
export type MissionStage = "playing" | "done";

const STAGES: Record<MissionStage, { statuses: GameStatus[]; refusal: string }> = {
  playing: { statuses: ["active"], refusal: "Only a running mission can be ended." },
  done: { statuses: ["found", "revealed"], refusal: "Only a finished mission can be reset." },
};

type RemoveMissionInput = { gameId: string; stage: MissionStage; now: Date };

/**
 * Deletes a mission, and its welcomer, guesses, shortlist and clue snapshot with it; the player's
 * album is theirs and stays. With no mission left they are back in No mission and can be started
 * again. Only a mission still in the stage the admin saw is deleted, so a stale End mission never
 * erases a mission that has just finished, nor a stale Reset one that is running.
 */
export async function removeMissionRecord({ gameId, stage, now }: RemoveMissionInput) {
  const found = await findGameById(gameId);
  if (!found) throw new AppError("not_found", "game missing");
  const game = await finalizeExpiredGameRecord(found, now);
  const { statuses, refusal } = STAGES[stage];
  if (!statuses.includes(game.status)) {
    throw new AppError("forbidden", `mission is not ${stage}`, { safeMessage: refusal });
  }

  const removed = await db
    .delete(games)
    .where(and(eq(games.id, gameId), inArray(games.status, statuses)))
    .returning({ id: games.id });
  if (removed.length === 0) {
    throw new AppError("forbidden", "mission changed since it was read", { safeMessage: refusal });
  }
}
