import "server-only";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import { firstName } from "../lib/first-name";
import { loadPlayerBoard } from "../server/load-player-board";

export type PlayerWelcome = {
  name: string;
  firstName: string;
  color: string;
  /** Three album stickers for the opening fan, with their public fields only. */
  fan: StickerPerson[];
  colors: [string | undefined, string | undefined];
};

export async function getPlayerWelcome(): Promise<PlayerWelcome | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  // Public fields only: the fan is decoration, so it never shows what a collection unlocks.
  const fan = board.stickers
    .slice(0, 3)
    .map(({ person: { name, number, team, color, tint, ask } }) => ({
      name,
      number,
      team,
      color,
      tint,
      ask,
    }));
  return {
    name: board.player.name,
    firstName: firstName(board.player.name),
    color: board.player.color,
    fan,
    colors: [board.teams[0]?.color, board.teams[2]?.color ?? board.teams[1]?.color],
  };
}
