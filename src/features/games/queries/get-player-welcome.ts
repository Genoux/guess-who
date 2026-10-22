import "server-only";
import { firstName } from "../lib/first-name";
import { loadPlayerBoard } from "../server/load-player-board";

export type PlayerWelcome = { firstName: string };

/** The player's first name for the intro; the tour itself uses a fictional cast. */
export async function getPlayerWelcome(): Promise<PlayerWelcome | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  return { firstName: firstName(board.player.name) };
}
