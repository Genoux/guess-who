import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { assertCanRemoveNewHire } from "./assert-can-remove-new-hire";
import { findGameById } from "./game-records";

type RemoveNewHireInput = { gameId: string; now: Date };

/** Deletes a game that has not started; its collections go with it by cascade, the people stay. */
export async function removeNewHireRecord({ gameId, now }: RemoveNewHireInput) {
  const game = await findGameById(gameId);
  if (!game) throw new AppError("not_found", "game missing");
  assertCanRemoveNewHire(game, now);

  const removed = await db
    .delete(games)
    .where(and(eq(games.id, gameId), eq(games.status, "active")))
    .returning({ id: games.id });
  if (removed.length === 0) {
    throw new AppError("forbidden", "game changed since it was read", {
      safeMessage: "This game can't be removed anymore.",
    });
  }
}
