import "server-only";
import { cache } from "react";
import type { Person } from "@/db/schema";
import { type MissionPhase, missionPhase } from "@/entities/mission-phase";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { finalizeExpiredGameRecord } from "@/shared/lib/finalize-expired-game-record";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { firstName } from "../lib/first-name";
import { buildGameClues, newestUnreadClue } from "../lib/game-clues";
import { stickerModeFor } from "../lib/sticker-mode";
import type { Game, GameViewer } from "../types";
import {
  findLatestPlayerGame,
  findPersonById,
  listAlbumPeople,
  listCollections,
  listGameClues,
  listGuesses,
  listShortlistedIds,
  listTeams,
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
  /** Null for a teammate with no mission. */
  game: GameView | null;
  mission: MissionPhase;
  /** Raw schedule inputs the pages format; never secret. */
  startDate: string | null;
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

/** The viewer's mission as player, ended first if day 14 passed; `game` is null without one. */
export const loadPlayerGame = cache(
  async (): Promise<{ game: Game | null; viewer: GameViewer; person: Person }> => {
    const { person, role } = await getViewerPerson();
    const latest = await findLatestPlayerGame(person.id);
    return {
      game: latest ? await finalizeExpiredGameRecord(latest, new Date()) : null,
      viewer: { personId: person.id, role },
      person,
    };
  },
);

/**
 * Everything the album and mission screens show, shaped for the viewer: locked stickers carry
 * only public fields, unreleased clues no text, the welcomer stays unknown until the mission is
 * over, and notes come only from the viewer's own collections.
 */
export const loadPlayerBoard = cache(async (): Promise<PlayerBoard> => {
  const { game, viewer, person } = await loadPlayerGame();
  const now = new Date();
  const mission = missionPhase(game);

  const [people, teams, collectionRows, shortlistedIds, guessRows, clueRows, welcomer] =
    await Promise.all([
      listAlbumPeople(),
      listTeams(),
      listCollections(person.id),
      game ? listShortlistedIds(game.id) : [],
      game ? listGuesses(game.id) : [],
      game ? listGameClues(game.id) : [],
      game ? findPersonById(game.welcomerPersonId) : undefined,
    ]);

  const gameView = game ? toGameView(game, viewer) : null;
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const notebook = new Map(
    collectionRows
      .map((row) => toCollectionView(row, viewer.personId))
      .map((view) => [view.personId, view.notebook?.note ?? null] as const),
  );
  // The welcomer's album sticker opens only once the reveal was watched, so no page gives it away
  // first; the outcome below carries their card for the reveal itself. It never counts as collected.
  const collectedIds = new Set(notebook.keys());
  const albumUnlocked = new Set(collectedIds);
  if (gameView?.welcomerPersonId && gameView.revealSeenAt) {
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
        over: mission !== "playing",
      }),
      collected: notebook.has(candidate.id),
      shortlisted: shortlisted.has(candidate.id),
      ruled: ruled.has(candidate.id),
      note: notebook.get(candidate.id) ?? null,
    };
  };
  // The welcomer of a running mission is always in the album, whatever their card says now, so
  // the mission stays winnable.
  const runningWelcomerId = mission === "playing" ? (game?.welcomerPersonId ?? null) : null;
  const albumPool =
    welcomer && runningWelcomerId === welcomer.id && !people.some(({ id }) => id === welcomer.id)
      ? [...people, welcomer].sort((a, b) => a.stickerNumber - b.stickerNumber)
      : people;
  const stickers = albumPool
    .filter((candidate) => isInAlbum(candidate, person.id) || candidate.id === runningWelcomerId)
    .map((candidate) => toBoardSticker(candidate));
  // The welcomer, only once the game view reveals them (found or revealed), face up whether or
  // not the album's own sticker is still locked.
  const revealedWelcomer =
    gameView?.welcomerPersonId && welcomer?.id === gameView.welcomerPersonId
      ? toBoardSticker(welcomer, new Set([...collectedIds, welcomer.id]))
      : null;

  // Clue 1 is the welcomer's team as it was at Start; toClueView keeps it hidden until it lands.
  const clues = game
    ? buildGameClues(game, clueRows, game.welcomerTeamName).map((clue) =>
        toClueView(clue, game, viewer, now),
      )
    : [];
  const playerTeam = person.teamId ? teamById.get(person.teamId) : undefined;

  return {
    game: gameView,
    mission,
    startDate: game?.startDate ?? null,
    lastReadClue: game?.lastReadClue ?? 0,
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
    newClue: game?.status === "active" ? newestUnreadClue(clues, game.lastReadClue) : null,
    collectedCount: stickers.filter((sticker) => sticker.collected).length,
  };
});

export type PlayerNav = {
  collectedCount: number;
  total: number;
  hasNewClue: boolean;
  /** The viewer has a mission in any state, so they get the Mission tab. */
  hasMission: boolean;
};

/** The count and the new clue dot for the top bar. */
export function toPlayerNav(board: PlayerBoard): PlayerNav {
  return {
    collectedCount: board.collectedCount,
    total: board.stickers.length,
    hasNewClue: board.newClue !== null,
    hasMission: board.mission !== "none",
  };
}
