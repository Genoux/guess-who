import "server-only";
import type { Game, GameViewer } from "../types";
import { canSeeGameSecrets } from "./can-see-game-secrets";

export type GameView = Pick<Game, "id" | "status" | "startDate" | "foundAt"> & {
  /** Null while the welcomer is still a secret for this viewer. */
  welcomerPersonId: string | null;
};

export function toGameView(game: Game, viewer: GameViewer): GameView {
  const revealed = game.status !== "active" || canSeeGameSecrets(game, viewer);
  return {
    id: game.id,
    status: game.status,
    startDate: game.startDate,
    foundAt: game.foundAt,
    welcomerPersonId: revealed ? game.welcomerPersonId : null,
  };
}
