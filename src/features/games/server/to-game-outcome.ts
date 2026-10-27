import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { gameDay } from "../lib/game-schedule";
import type { PlayerBoard } from "./load-player-board";

export type GameOutcome =
  | { over: false }
  | {
      over: true;
      found: boolean;
      welcomer: { firstName: string; person: StickerPerson; mode: StickerMode };
      /** Found on game day n, with this many clues out. Null when revealed on day 14. */
      foundOnDay: number | null;
      cluesUsed: number | null;
      revealSeen: boolean;
    };

/** How the player's game ended; `over: false` while it is still on. */
export function toGameOutcome({
  game,
  welcomer,
  startDate,
}: Pick<PlayerBoard, "game" | "welcomer" | "startDate">): GameOutcome {
  if (game.status === "active" || !welcomer) return { over: false };

  const foundAt = game.status === "found" ? game.foundAt : null;
  return {
    over: true,
    found: game.status === "found",
    welcomer: { firstName: welcomer.firstName, person: welcomer.person, mode: welcomer.mode },
    foundOnDay: foundAt ? gameDay(startDate, foundAt) : null,
    cluesUsed: game.status === "found" ? game.foundWithClues : null,
    revealSeen: game.revealSeenAt !== null,
  };
}
