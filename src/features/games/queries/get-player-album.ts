import "server-only";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { clueDay } from "../lib/game-clues";
import { loadPlayerBoard, type PlayerNav, toPlayerNav } from "../server/load-player-board";

export type AlbumSticker = {
  id: string;
  teamId: string | null;
  person: StickerPerson;
  mode: StickerMode;
};

export type PlayerAlbum = {
  nav: PlayerNav;
  active: boolean;
  introSeen: boolean;
  newClue: { number: number; day: number } | null;
  /** Set once the game is over: who the welcomer was. */
  outcome: { welcomerFirstName: string; found: boolean } | null;
  teams: { id: string; name: string; count: number }[];
  stickers: AlbumSticker[];
};

export async function getPlayerAlbum(): Promise<PlayerAlbum | null> {
  const board = await loadPlayerBoard();
  if (!board) return null;
  const welcomer = board.game.welcomerPersonId
    ? board.stickers.find((sticker) => sticker.id === board.game.welcomerPersonId)
    : undefined;

  return {
    nav: toPlayerNav(board),
    active: board.game.status === "active",
    introSeen: board.introSeen,
    newClue: board.newClue
      ? { number: board.newClue.number, day: clueDay(board.newClue.number) }
      : null,
    outcome:
      board.game.status === "active"
        ? null
        : { welcomerFirstName: welcomer?.firstName ?? "", found: board.game.status === "found" },
    teams: board.teams.map(({ id, name, count }) => ({ id, name, count })),
    stickers: board.stickers.map(({ id, teamId, person, mode }) => ({ id, teamId, person, mode })),
  };
}
