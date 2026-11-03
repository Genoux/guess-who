import "server-only";
import { z } from "zod";
import { loadPlayerBoard } from "../server/load-player-board";
import { type StickerDetail, toStickerDetail } from "../server/to-sticker-detail";

export type CollectTarget = StickerDetail & {
  active: boolean;
  collectedCount: number;
  total: number;
};

/** One sticker of the viewer's album; null when the id is not in it. */
export async function getCollectTarget(personId: string): Promise<CollectTarget | null> {
  if (!z.uuid().safeParse(personId).success) return null;
  const board = await loadPlayerBoard();
  const sticker = board.stickers.find((candidate) => candidate.id === personId);
  if (!sticker) return null;
  return {
    ...toStickerDetail(sticker),
    active: board.mission === "playing",
    collectedCount: board.collectedCount,
    total: board.stickers.length,
  };
}
