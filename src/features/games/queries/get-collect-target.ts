import "server-only";
import { z } from "zod";
import { loadPlayerBoard } from "../server/load-player-board";
import { toGameOutcome } from "../server/to-game-outcome";
import { type StickerDetail, toStickerDetail } from "../server/to-sticker-detail";

export type CollectTarget = StickerDetail & {
  active: boolean;
  collectedCount: number;
  total: number;
  /** How a find went; null until the guess has refreshed the page, and for every other ending. */
  foundOnDay: number | null;
  cluesUsed: number | null;
};

/** One sticker of the player's album; null when the id is not in it or there is no game. */
export async function getCollectTarget(personId: string): Promise<CollectTarget | null> {
  if (!z.uuid().safeParse(personId).success) return null;
  const board = await loadPlayerBoard();
  const sticker = board?.stickers.find((candidate) => candidate.id === personId);
  if (!board || !sticker) return null;
  const outcome = toGameOutcome(board);
  const found = outcome.over && outcome.found ? outcome : null;
  return {
    ...toStickerDetail(sticker),
    active: board.game.status === "active",
    collectedCount: board.collectedCount,
    total: board.stickers.length,
    foundOnDay: found?.foundOnDay ?? null,
    cluesUsed: found?.cluesUsed ?? null,
  };
}
