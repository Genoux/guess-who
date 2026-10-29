import "server-only";
import { AppError } from "@inbeat/core/errors";
import { hasStarted } from "../lib/new-hire-progress";
import type { Game } from "../types";
import { assertCanEditNewHire } from "./assert-can-edit-new-hire";

/** Only a game nobody has started can go. */
export function assertCanRemoveNewHire(
  game: Pick<Game, "status" | "startDate" | "playerPersonId">,
  now: Date,
) {
  assertCanEditNewHire(game, now);
  if (hasStarted(game.startDate, now)) {
    throw new AppError("forbidden", "game has started", {
      safeMessage: "A game that has started can't be removed.",
    });
  }
}
