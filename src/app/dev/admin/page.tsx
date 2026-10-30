import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEAM_DEFINITIONS } from "@/entities/teams";
import { AppTopNav } from "@/features/games/components/app-top-nav";
import { PeopleScreen } from "@/features/games/components/people-screen";
import { DEV_TOP_NAV } from "@/features/games/lib/dev-state";
import { avatarUrlOf, DEMO_PORTRAIT_SOURCES } from "@/features/games/server/demo-cast";
import {
  type GameActivity,
  type PersonRecord,
  toPeopleBoard,
} from "@/features/games/server/to-people-board";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "People (dev)",
  robots: { index: false, follow: false },
};

// Wednesday of day 3 for the oldest mission in play, so every state shows whatever day it is.
const NOW = new Date("2026-10-28T15:00:00Z");
const DAY_MS = 86_400_000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

const teamOf = (name: string) => TEAM_DEFINITIONS.find((team) => team.name === name);
const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".");

type Game = NonNullable<PersonRecord["game"]>;

const playing = (id: string, welcomerName: string, startDate: string): Game => ({
  id,
  status: "active",
  welcomerPersonId: "welcomer",
  welcomerName,
  startDate,
  foundAt: null,
  revealSeenAt: null,
});
const finished = (
  id: string,
  welcomerName: string,
  startDate: string,
  status: "found" | "revealed",
  foundAt: Date | null,
): Game => ({
  id,
  status,
  welcomerPersonId: "welcomer",
  welcomerName,
  startDate,
  foundAt,
  revealSeenAt: NOW,
});

const person = (
  name: string,
  team: string | null,
  {
    clues = 3,
    card = true,
    game = null,
  }: { clues?: number; card?: boolean; game?: Game | null } = {},
): PersonRecord => ({
  personId: slug(name),
  signedIn: true,
  name,
  email: `${slug(name)}@inbeat.agency`,
  team: card && team ? { name: team, color: teamOf(team)?.color ?? "#edede8" } : null,
  ask: card ? "Night trains" : null,
  // The demo cast has portraits; the rest of the crowd shows initials, so both are on screen.
  imageUrl: DEMO_PORTRAIT_SOURCES[name] ? avatarUrlOf(name) : null,
  // The people with a mission on the sample page are its new hires.
  newHire: game !== null && game.status === "active",
  cluesWritten: clues,
  game,
});

const invite = (id: string, email: string, welcomerName: string): PersonRecord => ({
  personId: null,
  signedIn: false,
  name: null,
  email,
  team: null,
  ask: null,
  imageUrl: null,
  newHire: true,
  cluesWritten: null,
  game: playing(id, welcomerName, "2026-10-28"),
});

const NAMED: PersonRecord[] = [
  person("Maya Chen", "Creative", { game: playing("maya", "Omar Aziz", "2026-10-26") }),
  person("Priya Shah", "Strategy", { game: playing("priya", "Lou Martin", "2026-10-23") }),
  person("Léa Dubois", "Talent", { game: playing("lea", "Ana Ferreira", "2026-10-19") }),
  person("Ethan Kim", "Talent", { game: playing("ethan", "Ines Costa", "2026-10-17") }),
  person("Bartholomew Featherstonehaugh-Montgomery the Third", "Strategy", {
    clues: 2,
    game: playing("bart", "Jonah Park", "2026-10-25"),
  }),
  person("Sam Taylor", "Creative", { clues: 0, game: playing("sam", "Noor Haddad", "2026-10-28") }),
  person("Chloe Martin", "Talent", {
    clues: 1,
    game: playing("chloe", "Theo Lindqvist", "2026-10-27"),
  }),
  invite("jordan", "jordan.lee@example.com", "Sam Rivera"),
  invite("dev", "dev.patel@example.com", "Grace Liu"),
  person("Diego Alvarez", "Creative", {
    game: finished(
      "diego",
      "Theo Lindqvist",
      "2026-09-24",
      "found",
      new Date("2026-10-02T15:00:00Z"),
    ),
  }),
  person("Hannah Wright", "Talent", {
    game: finished("hannah", "Sam Rivera", "2026-09-20", "revealed", null),
  }),
  person("Kofi Mensah", "Strategy", {
    game: finished("kofi", "Grace Liu", "2026-09-05", "found", new Date("2026-09-09T15:00:00Z")),
  }),
  // A new hire flagged from No mission with "Not yet": still waiting for a mission, no card yet.
  { ...person("Noel Fresh", null, { card: false, clues: 0 }), newHire: true },
  person("Omar Aziz", "Creative"),
  person("Ana Ferreira", "Talent"),
  person("Ines Costa", "Talent", { clues: 2 }),
  person("Jonah Park", "Strategy"),
  person("Lou Martin", "Strategy", { card: false, clues: 0 }),
  person("Noor Haddad", "Creative"),
  person("Theo Lindqvist", "Strategy", { clues: 1 }),
  person("Sam Rivera", "Creative"),
  person("Grace Liu", "Talent"),
];

const FIRST = [
  "Aiden",
  "Bianca",
  "Callum",
  "Dara",
  "Elio",
  "Farah",
  "Gabe",
  "Hana",
  "Ivan",
  "Jade",
  "Kai",
  "Lena",
  "Mateo",
  "Nina",
];
const LAST = [
  "Abbott",
  "Bishop",
  "Castro",
  "Dalton",
  "Ellis",
  "Fischer",
  "Gomez",
  "Hart",
  "Ibrahim",
  "Jensen",
  "Kowalski",
  "Lopez",
  "Moreau",
  "Nakamura",
];
const TEAMS = TEAM_DEFINITIONS.map(({ name }) => name);

// A deterministic crowd, so Show more and the filters have something to chew on.
const CROWD: PersonRecord[] = Array.from({ length: 70 }, (_, index) => {
  const card = index % 6 !== 0;
  const clues = card ? (index % 3 === 0 ? 3 : index % 3) : 0;
  return person(
    `${FIRST[index % 14]} ${LAST[(index * 5 + Math.floor(index / 14)) % 14]}`,
    TEAMS[index % TEAMS.length] ?? null,
    { card, clues },
  );
});

const ACTIVITY: GameActivity[] = [
  { gameId: "lea", collected: 14, lastActiveAt: daysAgo(1) },
  { gameId: "maya", collected: 4, lastActiveAt: new Date(NOW.getTime() - 12 * 60_000) },
  { gameId: "priya", collected: 9, lastActiveAt: new Date(NOW.getTime() - 2 * 3_600_000) },
  { gameId: "ethan", collected: 21, lastActiveAt: new Date(NOW.getTime() - 5 * 3_600_000) },
  { gameId: "bart", collected: 2, lastActiveAt: daysAgo(3) },
];

/**
 * The People page with sample people, for local dev and previews only. `?state=empty` shows the
 * page before anyone signed in, and `?delay=1500` makes each pretend action take that long, to
 * watch the move happen first, and `?fail=1` refuses every action, to watch it roll back. Nothing is saved.
 */
export default async function PeoplePreviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }
  const { state, delay, fail } = await props.searchParams;
  const previewDelayMs = Number(typeof delay === "string" ? delay : 0) || 0;
  const people = state === "empty" ? [] : [...NAMED, ...CROWD];

  return (
    <GameShell>
      <AppTopNav nav={DEV_TOP_NAV} current="admin" />
      <GameStage width="wide" className="justify-start">
        <PeopleScreen
          board={toPeopleBoard({ people, activity: ACTIVITY, now: NOW, viewerPersonId: null })}
          preview
          previewDelayMs={previewDelayMs}
          previewRefuses={fail === "1"}
        />
      </GameStage>
    </GameShell>
  );
}
