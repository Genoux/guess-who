import "server-only";
import { cache } from "react";
import type { Person } from "@/db/schema";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { firstName } from "../lib/first-name";
import { buildGameClues, newestUnreadClue } from "../lib/game-clues";
import { stickerModeFor } from "../lib/sticker-mode";
import type { Game, GameViewer } from "../types";
import { finalizeExpiredGameRecord } from "./finalize-expired-game-record";
import {
  findLatestPlayerGame,
  findPersonById,
  listAlbumPeople,
  listCollections,
  listGuesses,
  listShortlistedIds,
  listTeams,
  listWelcomerClues,
  type Team,
} from "./game-records";
import { isInAlbum } from "./is-in-album";
import { type ClueView, toClueView } from "./to-clue-view";
import { toCollectionView } from "./to-collection-view";
import { type GameView, toGameView } from "./to-game-view";
import { NO_TEAM, toStickerPerson } from "./to-sticker-person";
import { toStickerView } from "./to-sticker-view";

export type BoardSticker = {
  id: string;
  teamId: string | null;
  name: string;
  firstName: string;
  person: StickerPerson;
  mode: StickerMode;
  collected: boolean;
  shortlisted: boolean;
  ruled: boolean;
  /** The player's private note; only on stickers they collected. */
  note: string | null;
};

export type PlayerBoard = {
  game: GameView;
  /** Raw schedule inputs the pages format; never secret. */
  startDate: string;
  introSeen: boolean;
  lastReadClue: number;
  now: Date;
  player: { name: string; color: string };
  teams: (Pick<Team, "id" | "name" | "color"> & { count: number })[];
  stickers: BoardSticker[];
  /** Null while the game is active: the player never learns the welcomer before that. */
  welcomer: BoardSticker | null;
  clues: ClueView[];
  newClue: ClueView | null;
  collectedCount: number;
};

/** The viewer's game as player, ended first if day 14 passed; null when they have none. */
export const loadPlayerGame = cache(
  async (): Promise<{ game: Game; viewer: GameViewer; person: Person } | null> => {
    const { person, role } = await getViewerPerson();
    const game = await findLatestPlayerGame(person.id);
    if (!game) return null;
    return {
      game: await finalizeExpiredGameRecord(game, new Date()),
      viewer: { personId: person.id, role },
      person,
    };
  },
);

/**
 * Everything the player screens show, shaped for the player: locked stickers carry only public
 * fields, unreleased clues no text, the welcomer stays unknown until the game is over, and notes
 * come only from this game's collections.
 */
export const loadPlayerBoard = cache(async (): Promise<PlayerBoard | null> => {
  const context = await loadPlayerGame();
  if (!context) return null;
  const { game, viewer, person } = context;
  const now = new Date();

  const [people, teams, collectionRows, shortlistedIds, guessRows, clueRows, welcomer] =
    await Promise.all([
      listAlbumPeople(),
      listTeams(),
      listCollections(game.id),
      listShortlistedIds(game.id),
      listGuesses(game.id),
      listWelcomerClues(game.welcomerPersonId),
      findPersonById(game.welcomerPersonId),
    ]);

  const gameView = toGameView(game, viewer);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const notebook = new Map(
    collectionRows
      .map((row) => toCollectionView(row, game, viewer.personId))
      .map((view) => [view.personId, view.notebook?.note ?? null] as const),
  );
  // The welcomer's album sticker opens only once the reveal was watched, so no page gives it away
  // first; the outcome below carries their card for the reveal itself. It never counts as collected.
  const collectedIds = new Set(notebook.keys());
  const albumUnlocked = new Set(collectedIds);
  if (gameView.welcomerPersonId && gameView.revealSeenAt) {
    albumUnlocked.add(gameView.welcomerPersonId);
  }
  const ruled = new Set(guessRows.filter((guess) => !guess.correct).map((guess) => guess.personId));
  const shortlisted = new Set(shortlistedIds);

  const toBoardSticker = (candidate: Person, unlocked = albumUnlocked): BoardSticker => {
    const view = toStickerView(candidate, {
      personId: viewer.personId,
      collectedPersonIds: unlocked,
    });
    const team = candidate.teamId ? teamById.get(candidate.teamId) : undefined;
    return {
      id: candidate.id,
      teamId: candidate.teamId,
      name: candidate.name,
      firstName: firstName(candidate.name),
      person: toStickerPerson(view, team),
      mode: stickerModeFor({
        locked: view.locked,
        ruled: ruled.has(candidate.id),
        shortlisted: shortlisted.has(candidate.id),
        over: gameView.status !== "active",
      }),
      collected: notebook.has(candidate.id),
      shortlisted: shortlisted.has(candidate.id),
      ruled: ruled.has(candidate.id),
      note: notebook.get(candidate.id) ?? null,
    };
  };
  const stickers = people
    .filter((candidate) => isInAlbum(candidate, person.id))
    .map((candidate) => toBoardSticker(candidate));
  // The welcomer, only once the game view reveals them (found or revealed), face up whether or
  // not the album's own sticker is still locked.
  const revealedWelcomer =
    gameView.welcomerPersonId && welcomer?.id === gameView.welcomerPersonId
      ? toBoardSticker(welcomer, new Set([...collectedIds, welcomer.id]))
      : null;

  // Clue 1 is the welcomer's team; toClueView keeps it hidden until it lands.
  const welcomerTeam = welcomer?.teamId ? (teamById.get(welcomer.teamId)?.name ?? null) : null;
  const clues = buildGameClues(game, clueRows, welcomerTeam).map((clue) =>
    toClueView(clue, game, viewer, now),
  );
  const playerTeam = person.teamId ? teamById.get(person.teamId) : undefined;

  return {
    game: gameView,
    startDate: game.startDate,
    introSeen: game.introSeenAt !== null,
    lastReadClue: game.lastReadClue,
    now,
    player: { name: person.name, color: playerTeam?.color ?? NO_TEAM.color },
    teams: teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        count: stickers.filter((sticker) => sticker.teamId === team.id).length,
      }))
      .filter((team) => team.count > 0),
    stickers,
    welcomer: revealedWelcomer,
    clues,
    // The end opens every clue at once; none of them landed, so nothing is new.
    newClue: game.status === "active" ? newestUnreadClue(clues, game.lastReadClue) : null,
    collectedCount: stickers.filter((sticker) => sticker.collected).length,
  };
});

export type PlayerNav = {
  name: string;
  color: string;
  collectedCount: number;
  total: number;
  hasNewClue: boolean;
  /** The game ended, so the player can make their own card. */
  over: boolean;
};

/** The top bar: who is playing, the n / total count, the new clue dot and the card tab. */
export function toPlayerNav(board: PlayerBoard): PlayerNav {
  return {
    name: board.player.name,
    color: board.player.color,
    collectedCount: board.collectedCount,
    total: board.stickers.length,
    hasNewClue: board.newClue !== null,
    over: board.game.status !== "active",
  };
}
