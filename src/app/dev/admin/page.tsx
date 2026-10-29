import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEAM_DEFINITIONS, type TeamName } from "@/entities/teams";
import { NewHiresScreen } from "@/features/games/components/new-hires-screen";
import { TeammateTopNav } from "@/features/games/components/teammate-top-nav";
import {
  type NewHireGameRow,
  toNewHireBoard,
  type WelcomerCandidate,
} from "@/features/games/server/to-new-hire-board";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "New hires (dev)",
  robots: { index: false, follow: false },
};

// Wednesday of day 3 for the oldest game in play, so every state shows whatever day it is.
const NOW = new Date("2026-10-28T15:00:00Z");

const colorOf = (team: TeamName) =>
  TEAM_DEFINITIONS.find(({ name }) => name === team)?.color ?? null;

const person = (
  id: string,
  name: string,
  team: TeamName,
  writtenClues: readonly number[] = [2, 3, 4],
): WelcomerCandidate => ({
  id,
  name,
  email: `${id}@inbeat.agency`,
  hidden: false,
  teamId: team,
  ask: "Night trains",
  writtenClues,
  team,
  color: colorOf(team),
});

const TEAMMATES = [
  person("omar", "Omar Aziz", "Creative"),
  person("lou", "Lou Martin", "Strategy"),
  person("ana", "Ana Ferreira", "Talent"),
  person("ben", "Ben Carter", "Strategy"),
  person("mira", "Mira Okafor", "Creative"),
  person("ines", "Ines Costa", "Talent"),
  person("jonah", "Jonah Park", "Strategy"),
  person("noor", "Noor Haddad", "Creative"),
  person("theo", "Theo Lindqvist", "Strategy"),
  person("sam", "Sam Rivera", "Creative"),
  person("chloe", "Chloe Nguyen", "Strategy", [2]),
  person("lucas", "Lucas Silva", "Talent", []),
  { ...person("elena", "Elena Rossi", "Ops"), teamId: null, team: null, color: null },
];

const game = (welcomerId: string, overrides: Partial<NewHireGameRow>): NewHireGameRow => {
  const welcomer = TEAMMATES.find(({ id }) => id === welcomerId);
  return {
    id: "game",
    playerEmail: "",
    playerPersonId: null,
    playerName: null,
    startDate: "2026-10-26",
    status: "active",
    foundAt: null,
    creatorName: null,
    welcomerPersonId: welcomerId,
    welcomerName: welcomer?.name ?? "",
    welcomerColor: welcomer?.color ?? null,
    welcomerTeam: welcomer?.team ?? null,
    ...overrides,
  };
};

const GAMES: NewHireGameRow[] = [
  game("omar", {
    id: "maya",
    playerEmail: "maya.chen@inbeat.agency",
    playerPersonId: "maya",
    playerName: "Maya Chen",
  }),
  game("lou", {
    id: "priya",
    playerEmail: "priya.shah@gmail.com",
    startDate: "2026-10-27",
  }),
  game("ana", {
    id: "lea",
    playerEmail: "lea.dubois@inbeat.agency",
    playerPersonId: "lea",
    playerName: "Léa Dubois",
    startDate: "2026-10-19",
    creatorName: "Nita Rao",
  }),
  game("noor", {
    id: "bartholomew",
    playerEmail:
      "bartholomew.featherstonehaugh-montgomery@extraordinarily-long-company-name.example.com",
    playerPersonId: "bartholomew",
    playerName: "Bartholomew Featherstonehaugh-Montgomery the Third",
    startDate: "2026-10-23",
  }),
  game("sam", {
    id: "longmail",
    playerEmail:
      "a.remarkably.long.email.address.for.testing.truncation@some-long-company-domain.example.com",
    startDate: "2026-10-27",
  }),
  game("theo", {
    id: "noah",
    playerEmail: "noah.bell@inbeat.agency",
    playerPersonId: "noah",
    playerName: "Noah Bell",
    startDate: "2026-10-23",
  }),
  game("jonah", {
    id: "nora",
    playerEmail: "nora.quinn@inbeat.agency",
    playerPersonId: "nora",
    playerName: "Nora Quinn",
    startDate: "2026-11-04",
  }),
  game("ben", {
    id: "sam",
    playerEmail: "sam.taylor@inbeat.agency",
    startDate: "2026-11-02",
  }),
  game("mira", {
    id: "jordan",
    playerEmail: "jordan.lee@gmail.com",
    startDate: "2026-11-09",
    creatorName: "Nita Rao",
  }),
  game("ines", {
    id: "ethan",
    playerEmail: "ethan.kim@inbeat.agency",
    playerPersonId: "ethan",
    playerName: "Ethan Kim",
    startDate: "2026-09-28",
    status: "found",
    foundAt: new Date("2026-10-05T15:00:00Z"),
  }),
  game("jonah", {
    id: "isabel",
    playerEmail: "isabel.ruiz@inbeat.agency",
    playerPersonId: "isabel",
    playerName: "Isabel Ruiz",
    startDate: "2026-10-05",
    status: "revealed",
  }),
];

const ACTIVITY = [
  { gameId: "lea", collected: 9, lastActiveAt: new Date("2026-10-28T13:30:00Z") },
  { gameId: "maya", collected: 3, lastActiveAt: new Date("2026-10-27T18:00:00Z") },
  { gameId: "bartholomew", collected: 4, lastActiveAt: new Date("2026-10-23T16:00:00Z") },
  { gameId: "noah", collected: 2, lastActiveAt: new Date("2026-10-24T16:00:00Z") },
  {
    gameId: "ethan",
    collected: 9,

    lastActiveAt: new Date("2026-10-05T15:00:00Z"),
  },
  {
    gameId: "isabel",
    collected: 7,

    lastActiveAt: new Date("2026-10-18T15:00:00Z"),
  },
];

/**
 * The New hires page with sample games, for local dev and previews only. `?state=empty` shows the
 * page before any game. Nothing is saved.
 */
export default async function NewHiresPreviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }
  const { state } = await props.searchParams;
  const games = state === "empty" ? [] : GAMES;

  return (
    <GameShell>
      <TeammateTopNav current="admin" admin welcomer />
      <GameStage>
        <NewHiresScreen
          board={toNewHireBoard({
            games,
            activity: ACTIVITY,
            candidates: TEAMMATES,
            busyWelcomerIds: GAMES.filter(({ status }) => status === "active").map(
              ({ welcomerPersonId }) => welcomerPersonId,
            ),
            now: NOW,
          })}
          preview
        />
      </GameStage>
    </GameShell>
  );
}
