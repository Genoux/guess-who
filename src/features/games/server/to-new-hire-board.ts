import "server-only";
import type { Person } from "@/db/schema";
import { todayInGameZone } from "../lib/game-schedule";
import {
  canEditEmail,
  canEditNewHire,
  daysWithoutActivity,
  gamePhase,
  hasStarted,
  missingSignIn,
  newHireStatus,
  summarizeProgress,
} from "../lib/new-hire-progress";
import type {
  NewHireBoard,
  NewHireGroupKey,
  NewHireRowView,
  WelcomerOption,
} from "../lib/new-hire-view";
import { cluesReady, missingFor, sortByMissing } from "../lib/welcomer-readiness";
import type { Game } from "../types";
import { eligibleWelcomers } from "./choose-welcomer";
import { isInAlbum } from "./is-in-album";

export type NewHireGameRow = Pick<
  Game,
  "id" | "playerEmail" | "playerPersonId" | "welcomerPersonId" | "startDate" | "status" | "foundAt"
> & {
  playerName: string | null;
  creatorName: string | null;
  welcomerName: string;
  welcomerColor: string | null;
  welcomerTeam: string | null;
};

/** A teammate who may welcome a new hire, with the team shown beside their name. */
export type WelcomerCandidate = Pick<
  Person,
  "id" | "name" | "email" | "hidden" | "teamId" | "ask"
> & {
  team: string | null;
  color: string | null;
  /** Numbers of the clues (2 to 4) they wrote. */
  writtenClues: readonly number[];
};

/** What the new hire did in a game: stickers collected and the latest of it all. */
export type GameActivity = {
  gameId: string;
  collected: number;
  lastActiveAt: Date | null;
};

type ToNewHireBoardInput = {
  games: readonly NewHireGameRow[];
  activity: readonly GameActivity[];
  candidates: readonly WelcomerCandidate[];
  /** Everyone welcoming an active game. */
  busyWelcomerIds: readonly string[];
  now: Date;
};

const GROUPS: readonly { key: NewHireGroupKey; label: string }[] = [
  { key: "playing", label: "Playing" },
  { key: "upcoming", label: "Starting soon" },
  { key: "done", label: "Done" },
];

const byFirstDay = (a: NewHireRowView, b: NewHireRowView) => a.startDate.localeCompare(b.startDate);
const BY_GROUP: Record<NewHireGroupKey, (a: NewHireRowView, b: NewHireRowView) => number> = {
  playing: byFirstDay,
  upcoming: byFirstDay,
  done: (a, b) => byFirstDay(b, a),
};

/** The admin's list of new hires: one display-ready row per game, grouped by where it stands. */
export function toNewHireBoard({
  games,
  activity,
  candidates,
  busyWelcomerIds,
  now,
}: ToNewHireBoardInput): NewHireBoard {
  const optionsFor = (game: NewHireGameRow): WelcomerOption[] => {
    if (!canEditNewHire(game, now)) return [];
    const current: WelcomerOption = {
      id: game.welcomerPersonId,
      name: game.welcomerName,
      team: game.welcomerTeam,
      color: game.welcomerColor,
    };
    const others = eligibleWelcomers({
      people: candidates,
      busyWelcomerIds: busyWelcomerIds.filter((id) => id !== game.welcomerPersonId),
      playerEmail: game.playerEmail,
    })
      .filter(({ id }) => id !== game.welcomerPersonId)
      .map(({ id, name, team, color }) => ({ id, name, team, color }));
    return [current, ...others];
  };

  const activityOf = (game: NewHireGameRow) => activity.find(({ gameId }) => gameId === game.id);
  const progressOf = (game: NewHireGameRow) => {
    if (gamePhase(game, now) === "upcoming") return null;
    const { collected = 0, lastActiveAt = null } = activityOf(game) ?? {};
    return summarizeProgress({ collected, lastActiveAt, now });
  };

  const toRow = (game: NewHireGameRow): NewHireRowView => ({
    id: game.id,
    name: game.playerName,
    email: game.playerEmail,
    startDate: game.startDate,
    signInWarning: missingSignIn(game, now),
    welcomer: { id: game.welcomerPersonId, name: game.welcomerName, color: game.welcomerColor },
    welcomerOptions: optionsFor(game),
    progress: progressOf(game),
    stalledDays: daysWithoutActivity(game, activityOf(game)?.lastActiveAt ?? null, now),
    status: newHireStatus(game, now),
    editable: canEditNewHire(game, now),
    emailEditable: canEditEmail(game),
    started: hasStarted(game.startDate, now),
  });

  const activePlayerIds = new Set(
    games.filter(({ status }) => status === "active").map(({ playerPersonId }) => playerPersonId),
  );
  const pool = candidates.filter(({ id }) => !activePlayerIds.has(id));
  const missing = sortByMissing(
    pool.flatMap((person) => {
      const reason = missingFor(person, person.writtenClues);
      return reason ? [{ ...person, missing: reason }] : [];
    }),
  ).map(({ id, name, email, color, missing: reason }) => ({
    id,
    name,
    email,
    color,
    label: reason.label,
  }));

  const phaseOf = new Map(games.map((game) => [game.id, gamePhase(game, now)]));
  return {
    readiness: {
      ready: pool.filter((person) => isInAlbum(person, "") && cluesReady(person.writtenClues))
        .length,
      total: pool.length,
      missing,
    },
    today: todayInGameZone(now),
    groups: GROUPS.map(({ key, label }) => ({
      key,
      label,
      rows: games
        .filter(({ id }) => phaseOf.get(id) === key)
        .map(toRow)
        .sort(BY_GROUP[key]),
    })).filter(({ rows }) => rows.length > 0),
  };
}
