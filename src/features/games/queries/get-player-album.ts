import "server-only";
import { clueDay } from "../lib/game-clues";
import { loadPlayerBoard, type PlayerNav, toPlayerNav } from "../server/load-player-board";
import { type GameOutcome, toGameOutcome } from "../server/to-game-outcome";
import { type StickerDetail, toStickerDetail } from "../server/to-sticker-detail";

export type AlbumSticker = StickerDetail & { teamId: string | null };

export type PlayerAlbum = {
  nav: PlayerNav;
  active: boolean;
  newClue: { number: number; day: number } | null;
  outcome: GameOutcome;
  teams: { id: string; name: string; color: string; count: number }[];
  stickers: AlbumSticker[];
};

export async function getPlayerAlbum(): Promise<PlayerAlbum> {
  const board = await loadPlayerBoard();

  return {
    nav: toPlayerNav(board),
    active: board.mission === "playing",
    newClue: board.newClue
      ? { number: board.newClue.number, day: clueDay(board.newClue.number) }
      : null,
    outcome: toGameOutcome(board),
    teams: board.teams.map(({ id, name, color, count }) => ({ id, name, color, count })),
    stickers: board.stickers.map((sticker) => ({
      ...toStickerDetail(sticker),
      teamId: sticker.teamId,
    })),
  };
}
