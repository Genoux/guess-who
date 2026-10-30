import { gameDay } from "@/entities/game-schedule";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
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

/** The numbers of a find: the game day it happened on and how many clues were out. */
export function toFoundStats({
  startDate,
  foundAt,
  foundWithClues,
}: {
  startDate: string;
  foundAt: Date;
  foundWithClues: number | null;
}) {
  return { foundOnDay: gameDay(startDate, foundAt), cluesUsed: foundWithClues };
}

export type FoundStats = ReturnType<typeof toFoundStats>;

/** How the player's game ended; `over: false` while it is still on. */
export function toGameOutcome({
  game,
  welcomer,
  startDate,
}: Pick<PlayerBoard, "game" | "welcomer" | "startDate">): GameOutcome {
  if (!game || game.status === "active" || !welcomer || startDate === null) return { over: false };

  const { foundAt } = game;
  const stats =
    game.status === "found" && foundAt
      ? toFoundStats({ startDate, foundAt, foundWithClues: game.foundWithClues })
      : { foundOnDay: null, cluesUsed: null };
  return {
    over: true,
    found: game.status === "found",
    welcomer: { firstName: welcomer.firstName, person: welcomer.person, mode: welcomer.mode },
    ...stats,
    revealSeen: game.revealSeenAt !== null,
  };
}
