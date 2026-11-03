import "server-only";
import { clueCardState, clueUnlocksIn } from "../lib/game-clues";
import { loadPlayerBoard } from "../server/load-player-board";
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
  outcome: GameOutcome;
  clues: MissionClue[];
};

/** The viewer's mission screen; null without a mission. */
export async function getPlayerMission(): Promise<PlayerMission | null> {
  const board = await loadPlayerBoard();
  if (board.mission !== "playing" && board.mission !== "over") return null;
  if (board.startDate === null) return null;
  const { startDate, now } = board;
  return {
    outcome: toGameOutcome(board),
    clues: board.clues.map((clue) => {
      const state = clueCardState(clue, board.lastReadClue);
      return {
        number: clue.number,
        state,
        unlocksInDays: state === "down" ? clueUnlocksIn(clue.number, startDate, now) : null,
        text: state === "down" ? null : clue.text,
      };
    }),
  };
}
