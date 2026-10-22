import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import type { BoardSticker } from "./load-player-board";

/** One sticker as the detail view shows it: the same shape for the album overlay and the page. */
export type StickerDetail = {
  id: string;
  firstName: string;
  person: StickerPerson;
  mode: StickerMode;
  collected: boolean;
  shortlisted: boolean;
  ruled: boolean;
  /** The player's own note, once collected. */
  note: string | null;
};

/** Picks field by field, so nothing the board row carries beyond the detail can leak. */
export function toStickerDetail(sticker: BoardSticker): StickerDetail {
  return {
    id: sticker.id,
    firstName: sticker.firstName,
    person: sticker.person,
    mode: sticker.mode,
    collected: sticker.collected,
    shortlisted: sticker.shortlisted,
    ruled: sticker.ruled,
    note: sticker.note,
  };
}
