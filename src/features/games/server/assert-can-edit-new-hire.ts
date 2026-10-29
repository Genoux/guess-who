import "server-only";
import { AppError } from "@inbeat/core/errors";
import { canEditNewHire } from "../lib/new-hire-progress";
import type { Game } from "../types";

/** Until the new hire signs in, an admin can still fix the game's email and first day. */
export function assertCanEditNewHire(
  game: Pick<Game, "status" | "startDate" | "playerPersonId">,
  now: Date,
) {
  if (!canEditNewHire(game, now)) {
    throw new AppError("forbidden", "game is not editable", {
      safeMessage: "This game can't be edited anymore.",
    });
  }
}
