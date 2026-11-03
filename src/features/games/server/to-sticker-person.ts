import "server-only";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import type { StickerView } from "./to-sticker-view";

type TeamLook = { name: string; color: string; tint: string };

/** A new hire has no team yet: the game's yellow, as data for the sticker's inline colors. */
export const NO_TEAM: TeamLook = { name: "New hire", color: "#F9D317", tint: "#FDEDA2" };

/**
 * What the Sticker component renders, from a shaped sticker view. A locked view has no fact,
 * city or photo, so neither has the result.
 */
export function toStickerPerson(view: StickerView, team: TeamLook | undefined): StickerPerson {
  const look = team ?? NO_TEAM;
  const sticker: StickerPerson = {
    name: view.name,
    number: view.stickerNumber,
    team: look.name,
    color: look.color,
    tint: look.tint,
    ask: view.ask ?? "",
  };
  if (view.locked) return sticker;
  // shortcut: the Clerk (Slack) picture until phase 3 adds uploads; an uploaded photo will win.
  return { ...sticker, city: view.location, fact: view.fact, photoUrl: view.imageUrl };
}
