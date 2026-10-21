import "server-only";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import { clueCardState, clueDay, MISSING_CLUE_TEXT, nextClue } from "../lib/game-clues";
import { daysLeft } from "../lib/game-schedule";
import { loadPlayerBoard, type PlayerNav, toPlayerNav } from "../server/load-player-board";

export type MissionClue = {
  number: number;
  day: number;
  state: "down" | "new" | "open";
  /** Null while face down. */
  text: string | null;
};

export type MissionSuspect = { id: string; firstName: string; person: StickerPerson };

export type PlayerMission = {
  nav: PlayerNav;
  active: boolean;
  daysLeft: number;
  nextClue: { number: number; inDays: number } | null;
  clues: MissionClue[];
  maybes: MissionSuspect[];
  ruledOut: { id: string; name: string; color: string }[];
};

export async function getPlayerMission(): Promise<PlayerMission | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  return {
    nav: toPlayerNav(board),
    active: board.game.status === "active",
    daysLeft: daysLeft(board.startDate, board.now),
    nextClue: nextClue(board.startDate, board.now),
    clues: board.clues.map((clue) => {
      const state = clueCardState(clue, board.lastReadClue);
      return {
        number: clue.number,
        day: clueDay(clue.number),
        state,
        text: state === "down" ? null : (clue.text ?? MISSING_CLUE_TEXT),
      };
    }),
    maybes: board.stickers
      .filter((sticker) => sticker.mode === "maybe")
      .map(({ id, firstName, person }) => ({ id, firstName, person })),
    ruledOut: board.stickers
      .filter((sticker) => sticker.mode === "ruled")
      .map(({ id, name, person }) => ({ id, name, color: person.color })),
  };
}
