import "server-only";
import { clueDay, MISSING_CLUE_TEXT } from "../lib/game-clues";
import { loadPlayerBoard } from "../server/load-player-board";

export type ClueReveal = {
  number: number;
  day: number;
  text: string;
  releasedCount: number;
  generated: boolean;
};

/**
 * The newest released clue the player has not opened, else the newest released one (so the
 * screen stays put after it is marked read); null before clue 1 lands.
 */
export async function getClueReveal(): Promise<ClueReveal | null> {
  const board = await loadPlayerBoard();
  const clue = board?.newClue ?? board?.clues.filter((candidate) => candidate.released).at(-1);
  if (!board || !clue?.released) return null;
  return {
    number: clue.number,
    day: clueDay(clue.number),
    text: clue.text ?? MISSING_CLUE_TEXT,
    releasedCount: board.clues.filter((candidate) => candidate.released).length,
    generated: clue.number === 1,
  };
}
