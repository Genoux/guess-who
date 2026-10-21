import "server-only";
import type { Game, GameViewer } from "../types";

/**
 * Who the welcomer is and unreleased clues: the game's welcomer and admins, never the player
 * (even when the player is an admin).
 */
export function canSeeGameSecrets(
  game: Pick<Game, "playerPersonId" | "welcomerPersonId">,
  viewer: GameViewer,
) {
  if (viewer.personId === game.playerPersonId) return false;
  return viewer.role === "admin" || viewer.personId === game.welcomerPersonId;
}
