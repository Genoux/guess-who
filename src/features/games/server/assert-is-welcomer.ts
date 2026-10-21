import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";

/** Only the game's welcomer opens the welcomer desk; admins and the player never do. */
export function assertIsWelcomer(
  game: Pick<Game, "playerPersonId" | "welcomerPersonId">,
  viewerPersonId: string,
) {
  if (game.welcomerPersonId !== viewerPersonId || game.playerPersonId === viewerPersonId) {
    throw new AppError("forbidden", "viewer is not the welcomer of this game");
  }
}
