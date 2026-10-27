import "server-only";
import { clueCardState, clueUnlocksIn, MISSING_CLUE_TEXT } from "../lib/game-clues";
import { loadPlayerBoard, type PlayerNav, toPlayerNav } from "../server/load-player-board";
import { type GameOutcome, toGameOutcome } from "../server/to-game-outcome";

export type MissionClue = {
  number: number;
  state: "down" | "new" | "open";
  /** Whole days until a clue not out yet lands; null once it is out. */
  unlocksInDays: number | null;
  /** Null while face down. */
  text: string | null;
};

export type PlayerMission = {
  nav: PlayerNav;
  outcome: GameOutcome;
  clues: MissionClue[];
};

export async function getPlayerMission(): Promise<PlayerMission | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  return {
    nav: toPlayerNav(board),
    outcome: toGameOutcome(board),
    clues: board.clues.map((clue) => {
      const state = clueCardState(clue, board.lastReadClue);
      return {
        number: clue.number,
        state,
        unlocksInDays:
          state === "down" ? clueUnlocksIn(clue.number, board.startDate, board.now) : null,
        text: state === "down" ? null : (clue.text ?? MISSING_CLUE_TEXT),
      };
    }),
  };
}
