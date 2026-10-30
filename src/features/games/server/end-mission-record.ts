import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { finalizeExpiredGameRecord } from "@/shared/lib/finalize-expired-game-record";
import { findGameById } from "./game-records";

type EndMissionInput = { gameId: string; now: Date };

const NOT_RUNNING = "Only a running mission can be ended.";

/**
 * Ends a running mission: the game is deleted, and its welcomer, guesses, shortlist and clue
 * snapshot go with it. The player's album is theirs and stays.
 */
export async function endMissionRecord({ gameId, now }: EndMissionInput) {
  const found = await findGameById(gameId);
  if (!found) throw new AppError("not_found", "game missing");
  const game = await finalizeExpiredGameRecord(found, now);
  if (game.status !== "active") {
    throw new AppError("forbidden", "mission is not running", { safeMessage: NOT_RUNNING });
  }

  const ended = await db
    .delete(games)
    .where(and(eq(games.id, gameId), eq(games.status, "active")))
    .returning({ id: games.id });
  if (ended.length === 0) {
    throw new AppError("forbidden", "mission changed since it was read", {
      safeMessage: NOT_RUNNING,
    });
  }
}
