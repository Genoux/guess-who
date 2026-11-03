import "server-only";
import type { Game, GameViewer } from "../types";
import { canSeeGameSecrets } from "./can-see-game-secrets";

export type GameView = Pick<
  Game,
  "id" | "status" | "startDate" | "foundAt" | "foundWithClues" | "revealSeenAt"
> & {
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
    foundWithClues: game.foundWithClues,
    revealSeenAt: game.revealSeenAt,
    welcomerPersonId: revealed ? game.welcomerPersonId : null,
  };
}
