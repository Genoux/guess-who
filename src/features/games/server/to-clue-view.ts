import "server-only";
import { isClueOut } from "../lib/game-clues";
import type { Clue, Game, GameViewer } from "../types";
import { canSeeGameSecrets } from "./can-see-game-secrets";

export type ClueView = Pick<Clue, "id" | "number" | "releaseAt"> & {
  released: boolean;
  /** Null until the clue is out for everyone but the welcomer and admins. */
  text: string | null;
};

export function toClueView(
  clue: Clue,
  game: Pick<Game, "playerPersonId" | "welcomerPersonId" | "status">,
  viewer: GameViewer,
  now: Date,
): ClueView {
  const released = isClueOut(clue.releaseAt, game, now);
  return {
    id: clue.id,
    number: clue.number,
    releaseAt: clue.releaseAt,
    released,
    text: released || canSeeGameSecrets(game, viewer) ? clue.text : null,
  };
}
