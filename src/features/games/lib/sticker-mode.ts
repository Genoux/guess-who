import type { StickerMode } from "@/shared/components/game/sticker-view";

type StickerModeInput = {
  /** The player has not collected this sticker (and it is not the revealed welcomer). */
  locked: boolean;
  /** A wrong guess ruled this person out. */
  ruled: boolean;
  /** On the player's maybe list. */
  shortlisted: boolean;
  /** This is the welcomer and the game is over: found by the player, or revealed on day 14. */
  welcomer: "found" | "revealed" | null;
};

/** How a sticker shows in the player's album. */
export function stickerModeFor({
  locked,
  ruled,
  shortlisted,
  welcomer,
}: StickerModeInput): StickerMode {
  if (welcomer === "found") return "found";
  if (welcomer === "revealed") return "collected";
  if (locked) return "locked";
  if (ruled) return "ruled";
  return shortlisted ? "maybe" : "collected";
}
