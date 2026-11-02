import "server-only";
import { gameDay, todayInGameZone } from "@/entities/game-schedule";
import { missionOutcome, missionStateAt, summarizeProgress } from "../lib/mission-progress";
import type {
  DoneRowView,
  NoMissionRowView,
  PeopleBoard,
  PlayingRowView,
} from "../lib/people-view";
import { asWelcomer } from "../lib/welcomer-readiness";
import type { Game } from "../types";

/** One line of the admin's data: a person, signed in or only invited by email. */
export type PersonRecord = {
  personId: string;
  signedIn: boolean;
  name: string | null;
  email: string;
  team: { name: string; color: string } | null;
  teamId: string | null;
  location: string | null;
  fact: string | null;
  ask: string | null;
  imageUrl: string | null;
  newHire: boolean;
  /** Clues 2 to 4 written. */
  cluesWritten: number;
  game:
    | (Pick<
        Game,
        "id" | "status" | "welcomerPersonId" | "startDate" | "foundAt" | "revealSeenAt"
      > & {
        welcomerName: string | null;
      })
    | null;
};

/** What the player did in a mission: stickers collected and the latest of it all. */
export type GameActivity = {
  gameId: string;
  collected: number;
  lastActiveAt: Date | null;
};

type ToPeopleBoardInput = {
  people: readonly PersonRecord[];
  activity: readonly GameActivity[];
  now: Date;
  /** The admin looking: their own mission never shows its welcomer, as `canSeeGameSecrets` has it. */
  viewerPersonId: string | null;
};

const ENDED_ON = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const formatEndedOn = (endedAt: Date) =>
  ENDED_ON.format(new Date(`${todayInGameZone(endedAt)}T12:00:00Z`));

const byName = (
  a: { name: string | null; email: string },
  b: { name: string | null; email: string },
) => (a.name ?? a.email).localeCompare(b.name ?? b.email);

// shortcut: loads every person; paginate server-side past a few hundred.
/** The admin's People data, shaped for its three views, each person in exactly one: playing, no
 * mission and done. */
export function toPeopleBoard({
  people,
  activity,
  now,
  viewerPersonId,
}: ToPeopleBoardInput): PeopleBoard {
  const playing: PlayingRowView[] = [];
  const noMission: NoMissionRowView[] = [];
  const done: (DoneRowView & { endedAt: Date })[] = [];
  const welcomingIds = new Set(
    people.flatMap(({ game }) =>
      game && missionStateAt(game, now) === "playing" ? [game.welcomerPersonId] : [],
    ),
  );

  for (const record of people) {
    const { game } = record;
    const state = missionStateAt(game, now);
    const identity = {
      key: record.personId,
      welcoming: welcomingIds.has(record.personId),
      signedIn: record.signedIn,
      name: record.name,
      email: record.email,
      team: record.team,
      imageUrl: record.imageUrl,
      newHire: record.newHire,
    };

    const standing = asWelcomer(record, record.cluesWritten);
    if (!game) {
      noMission.push({ ...identity, asWelcomer: standing });
      continue;
    }

    // A player never learns the welcomer before the reveal, even an admin looking at their own row.
    const welcomer =
      record.personId === viewerPersonId && !game.revealSeenAt ? null : (game.welcomerName ?? "");
    if (state === "playing") {
      const stats = activity.find(({ gameId }) => gameId === game.id);
      playing.push({
        ...identity,
        asWelcomer: standing,
        gameId: game.id,
        welcomer,
        day: gameDay(game.startDate, now),
        progress: summarizeProgress({
          collected: stats?.collected ?? 0,
          lastActiveAt: stats?.lastActiveAt ?? null,
          now,
        }),
      });
    } else if (state === "over") {
      const { label, found, endedAt } = missionOutcome(game);
      done.push({
        ...identity,
        gameId: game.id,
        welcomer,
        outcome: { label, found },
        endedOn: formatEndedOn(endedAt),
        endedAt,
      });
    }
  }

  return {
    playing: playing.sort((a, b) => b.day - a.day || byName(a, b)),
    noMission: noMission.sort(byName),
    done: done
      .sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime())
      .map(({ endedAt: _, ...row }) => row),
  };
}
