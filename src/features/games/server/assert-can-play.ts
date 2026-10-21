import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";

export function assertCanPlay(game: Pick<Game, "playerPersonId">, viewerPersonId: string) {
  if (game.playerPersonId === null || game.playerPersonId !== viewerPersonId) {
    throw new AppError("forbidden", "viewer is not the player of this game");
  }
}
