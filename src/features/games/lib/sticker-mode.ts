import type { StickerMode } from "@/shared/components/game/sticker-view";

type StickerModeInput = {
  /** The player has not collected this sticker (and it is not the revealed welcomer). */
  locked: boolean;
  /** A wrong guess ruled this person out. */
  ruled: boolean;
  /** On the player's maybe list. */
  shortlisted: boolean;
  /** The game is over: the album is plain, with no maybe or not-them badges. */
  over: boolean;
};

/** How a sticker shows in the player's album. */
export function stickerModeFor({
  locked,
  ruled,
  shortlisted,
  over,
}: StickerModeInput): StickerMode {
  if (locked) return "locked";
  if (over) return "collected";
  if (ruled) return "ruled";
  return shortlisted ? "maybe" : "collected";
}
