import { getInitials } from "@inbeat/ui/lib/initials";
import { readableOn } from "@/shared/lib/contrast";

/** `welcomer` is the welcome tour's found card; the game itself stamps `found`. */
export type StickerMode = "locked" | "collected" | "maybe" | "ruled" | "found" | "welcomer";
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
  /** Text color on the tint; ink when unset. */
  tintInk?: string;
  ask: string;
  city?: string | null;
  fact?: string | null;
  photoUrl?: string | null;
};

export type StickerStamp = Exclude<StickerMode, "locked" | "collected">;

export type StickerView = {
  /** The collected face is showing (every mode but locked). */
  open: boolean;
  stamp: StickerStamp | null;
  /** The line under the name: the team, plus the city on an open large sticker. */
  subtitle: string;
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
  const open = mode !== "locked";
  const teamLine = [person.team, open && size === "lg" ? person.city : null]
    .filter(Boolean)
    .join(" · ");

  return {
    open,
    stamp: mode === "locked" || mode === "collected" ? null : mode,
    subtitle: teamLine,
    showMore: open && size === "lg",
    initials: getInitials(person.name, "?"),
    initialsTone: readableOn(person.color),
  };
}

/** Which celebration a mode change earns: unlocking a sticker. */
export function stickerCelebration(previous: StickerMode, next: StickerMode): "unlock" | null {
  if (previous === next) return null;
  if (previous === "locked") return "unlock";
  return null;
}
