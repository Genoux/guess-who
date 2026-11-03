import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";

export function assertGameOver(game: Pick<Game, "status">) {
  if (game.status === "active") throw new AppError("conflict", "game is not over");
}
