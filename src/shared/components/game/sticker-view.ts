import { getInitials } from "@inbeat/ui/lib/initials";
import { readableOn } from "@/shared/lib/contrast";

export type StickerMode = "locked" | "collected" | "maybe" | "ruled" | "found";
export type StickerSize = "sm" | "lg";

/**
 * One person's sticker. A locked sticker only needs the public fields: the server never sends a
 * locked sticker's fact, city or photo.
 */
export type StickerPerson = {
  name: string;
  number: number | string;
  team: string;
  /** Team color, behind the photo or initials. */
  color: string;
  /** Lighter team tint, behind the "Ask me about" line. */
  tint: string;
  ask: string;
  city?: string | null;
  fact?: string | null;
  photoUrl?: string | null;
};

export type StickerStamp = "maybe" | "ruled" | "found";

export type StickerView = {
  /** The collected face is showing (every mode but locked). */
  open: boolean;
  stamp: StickerStamp | null;
  number: string;
  lockedMeta: string;
  openMeta: string;
  /** The large sticker adds the fact and the ask line under the name. */
  showMore: boolean;
  initials: string;
  initialsTone: "ink" | "white";
};

export function formatStickerNumber(value: number | string): string {
  const text = String(value).trim();
  return /^\d$/.test(text) ? `0${text}` : text;
}

export function getStickerView(
  person: StickerPerson,
  mode: StickerMode,
  size: StickerSize,
): StickerView {
  const number = formatStickerNumber(person.number);
  const lockedMeta = `No. ${number} · ${person.team}`;
  const wideMeta = [lockedMeta, size === "lg" ? person.city : null].filter(Boolean).join(" · ");
  const open = mode !== "locked";

  return {
    open,
    stamp: mode === "maybe" || mode === "ruled" || mode === "found" ? mode : null,
    number,
    lockedMeta,
    openMeta: mode === "ruled" ? `Not them · No. ${number}` : wideMeta,
    showMore: open && size === "lg",
    initials: getInitials(person.name, "?"),
    initialsTone: readableOn(person.color),
  };
}

/** Which celebration a mode change earns: unlocking a sticker, or finding the welcomer. */
export function stickerCelebration(
  previous: StickerMode,
  next: StickerMode,
): "unlock" | "found" | null {
  if (previous === next) return null;
  if (next === "found") return "found";
  if (previous === "locked") return "unlock";
  return null;
}
