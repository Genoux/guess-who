import type { gameStatus } from "@/db/schema";
import type { CardAudience } from "../types";

type GameStatus = (typeof gameStatus.enumValues)[number];

/** Anyone edits their own card, mid-mission too; the copy only changes once a mission has ended. */
export function cardAudience(playerGameStatuses: readonly GameStatus[]): CardAudience {
  return playerGameStatuses.some((status) => status !== "active") ? "new-hire" : "teammate";
}
