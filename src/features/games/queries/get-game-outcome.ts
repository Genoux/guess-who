import "server-only";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { CLUE_NUMBERS, clueReleaseAt, gameDay } from "../lib/game-schedule";
import { loadPlayerBoard } from "../server/load-player-board";

export type GameOutcome =
  | { over: false }
  | {
      over: true;
      found: boolean;
      welcomer: { firstName: string; person: StickerPerson; mode: StickerMode };
      /** Found on game day n, with this many clues out. Null when revealed on day 14. */
      foundOnDay: number | null;
      cluesUsed: number | null;
    };

/** How the player's game ended; `over: false` while it is still on. */
export async function getGameOutcome(): Promise<GameOutcome | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  const { game, welcomer } = board;
  if (game.status === "active" || !welcomer) return { over: false };

  const foundAt = game.status === "found" ? game.foundAt : null;
  return {
    over: true,
    found: game.status === "found",
    welcomer: { firstName: welcomer.firstName, person: welcomer.person, mode: welcomer.mode },
    foundOnDay: foundAt ? gameDay(board.startDate, foundAt) : null,
    cluesUsed: foundAt
      ? CLUE_NUMBERS.filter((number) => clueReleaseAt(board.startDate, number) <= foundAt).length
      : null,
  };
}
