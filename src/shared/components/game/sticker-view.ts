import { getInitials } from "@inbeat/ui/lib/initials";

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
  /** Team color; the card itself paints with `tint`. */
  color: string;
  /** Lighter team tint: behind the initials, the ask and the locked face. */
  tint: string;
  /** Text color on the tint, ink when unset. */
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
  /** The line under the name: the team, plus the city once the card is open. */
  subtitle: string;
  initials: string;
};

export type AskTextStep = "large" | "medium" | "small";

// The locked face has a fixed box, so a longer ask steps down a size. The small sticker's box is
// short: its smallest size holds the 55 character limit. Larger values only matter for asks saved
// before that limit.
const ASK_STEP_MAX_LENGTH: Record<StickerSize, { large: number; medium: number }> = {
  sm: { large: 16, medium: 32 },
  lg: { large: 32, medium: 56 },
};

export function getAskTextStep(ask: string, size: StickerSize): AskTextStep {
  const { length } = ask.trim();
  const max = ASK_STEP_MAX_LENGTH[size];
  if (length <= max.large) return "large";
  return length <= max.medium ? "medium" : "small";
}

export function formatStickerNumber(value: number | string): string {
  const text = String(value).trim();
  return /^\d$/.test(text) ? `0${text}` : text;
}

export function getStickerView(person: StickerPerson, mode: StickerMode): StickerView {
  const open = mode !== "locked";
  const teamLine = [person.team, open ? person.city?.trim() : null].filter(Boolean).join(" · ");

  return {
    open,
    stamp: mode === "locked" || mode === "collected" ? null : mode,
    subtitle: teamLine,
    initials: getInitials(person.name, "?"),
  };
}

/** Which celebration a mode change earns: unlocking a sticker. */
export function stickerCelebration(previous: StickerMode, next: StickerMode): "unlock" | null {
  if (previous === next) return null;
  if (previous === "locked") return "unlock";
  return null;
}
