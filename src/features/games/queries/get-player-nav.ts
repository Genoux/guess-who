import "server-only";
import { loadPlayerBoard, type PlayerNav, toPlayerNav } from "../server/load-player-board";

/** The player's top bar; null for a viewer with no game of their own. */
export async function getPlayerNav(): Promise<PlayerNav | null> {
  const board = await loadPlayerBoard();
  return board ? toPlayerNav(board) : null;
}
