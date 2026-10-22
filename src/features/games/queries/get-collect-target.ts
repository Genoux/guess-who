import "server-only";
import { z } from "zod";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { loadPlayerBoard } from "../server/load-player-board";

export type CollectTarget = {
  id: string;
  firstName: string;
  person: StickerPerson;
  mode: StickerMode;
  collected: boolean;
  shortlisted: boolean;
  ruled: boolean;
  /** The player's own note, once collected. */
  note: string | null;
  active: boolean;
  collectedCount: number;
  total: number;
};

/** One sticker of the player's album; null when the id is not in it or there is no game. */
export async function getCollectTarget(personId: string): Promise<CollectTarget | null> {
  if (!z.uuid().safeParse(personId).success) return null;
  const board = await loadPlayerBoard();
  const sticker = board?.stickers.find((candidate) => candidate.id === personId);
  if (!board || !sticker) return null;
  return {
    id: sticker.id,
    firstName: sticker.firstName,
    person: sticker.person,
    mode: sticker.mode,
    collected: sticker.collected,
    shortlisted: sticker.shortlisted,
    ruled: sticker.ruled,
    note: sticker.note,
    active: board.game.status === "active",
    collectedCount: board.collectedCount,
    total: board.stickers.length,
  };
}
