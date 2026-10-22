import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { gameStatus } from "@/db/schema";
import type { CardAudience } from "../types";

type GameStatus = (typeof gameStatus.enumValues)[number];

/**
 * Who may edit their own card, from the statuses of the games they play. A new hire mid-game makes
 * their sticker only once the game is found or revealed; everyone else is a teammate.
 */
export function assertCanEditCard(playerGameStatuses: readonly GameStatus[]): CardAudience {
  if (playerGameStatuses.includes("active")) {
    throw new AppError("forbidden", "player cannot edit their card during an active game");
  }
  return playerGameStatuses.length > 0 ? "new-hire" : "teammate";
}
