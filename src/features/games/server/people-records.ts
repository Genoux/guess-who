import "server-only";
import { asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { games, people, teams } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import type { WelcomerCandidate } from "./choose-welcomer";
import type { GameActivity, PersonRecord } from "./to-people-board";

const player = alias(people, "player");
const welcomer = alias(people, "welcomer");

const WRITTEN_CLUES =
  sql<number>`(select count(*) from "welcomer_clues" where "welcomer_clues"."person_id" = ${people.id} and btrim("welcomer_clues"."text") <> '')`.mapWith(
    Number,
  );

const gameColumns = {
  id: games.id,
  status: games.status,
  welcomerPersonId: games.welcomerPersonId,
  startDate: games.startDate,
  foundAt: games.foundAt,
  revealSeenAt: games.revealSeenAt,
  welcomerName: welcomer.name,
};

type GameColumns = {
  id: string | null;
  status: Game["status"] | null;
  welcomerPersonId: string | null;
  startDate: string | null;
  foundAt: Date | null;
  revealSeenAt: Date | null;
  welcomerName: string | null;
};

const toGame = ({
  id,
  status,
  welcomerPersonId,
  startDate,
  ...rest
}: GameColumns): PersonRecord["game"] =>
  id && status && welcomerPersonId && startDate
    ? { id, status, welcomerPersonId, startDate, ...rest }
    : null;

const toTeam = (name: string | null, color: string | null) =>
  name && color ? { name, color } : null;

/** Everyone who signed in, with their mission if they have one, then the emails nobody has. */
export async function listPeople(): Promise<PersonRecord[]> {
  const [signedIn, invited] = await Promise.all([
    db
      .select({
        personId: people.id,
        name: people.name,
        email: people.email,
        teamName: teams.name,
        teamColor: teams.color,
        ask: people.ask,
        imageUrl: people.imageUrl,
        newHire: people.newHire,
        cluesWritten: WRITTEN_CLUES,
        ...gameColumns,
      })
      .from(people)
      .leftJoin(teams, eq(people.teamId, teams.id))
      .leftJoin(games, eq(games.playerPersonId, people.id))
      .leftJoin(welcomer, eq(games.welcomerPersonId, welcomer.id))
      .where(isNotNull(people.clerkUserId)),
    db
      .select({
        name: player.name,
        imageUrl: player.imageUrl,
        newHire: player.newHire,
        email: games.playerEmail,
        ...gameColumns,
      })
      .from(games)
      .leftJoin(player, eq(games.playerPersonId, player.id))
      .leftJoin(welcomer, eq(games.welcomerPersonId, welcomer.id))
      .where(isNull(player.clerkUserId)),
  ]);
  return [
    ...signedIn.map(
      ({
        personId,
        name,
        email,
        teamName,
        teamColor,
        ask,
        imageUrl,
        newHire,
        cluesWritten,
        ...game
      }) => ({
        personId,
        signedIn: true,
        name,
        email,
        team: toTeam(teamName, teamColor),
        ask,
        imageUrl,
        newHire,
        cluesWritten,
        game: toGame(game),
      }),
    ),
    ...invited.map(({ name, imageUrl, newHire, email, ...game }) => ({
      personId: null,
      signedIn: false,
      name,
      email,
      team: null,
      ask: null,
      imageUrl,
      newHire: newHire ?? true,
      cluesWritten: null,
      game: toGame(game),
    })),
  ];
}

/** Every visible teammate with the numbers of the clues they wrote. */
export async function listWelcomerCandidates(): Promise<WelcomerCandidate[]> {
  return db
    .select({
      id: people.id,
      email: people.email,
      hidden: people.hidden,
      teamId: people.teamId,
      ask: people.ask,
      writtenClues: sql<number[]>`array(
        select "welcomer_clues"."number" from "welcomer_clues"
        where "welcomer_clues"."person_id" = "people"."id" and btrim("welcomer_clues"."text") <> ''
        order by "welcomer_clues"."number"
      )`.mapWith((value) => (Array.isArray(value) ? value.map(Number) : [])),
    })
    .from(people)
    .where(eq(people.hidden, false))
    .orderBy(asc(people.name));
}

// Drizzle drops table names from columns in a one-table select, which would make `id` inside a
// subquery mean the subquery's own table, so the correlated columns are written out.
const GAME_ID = sql.raw('"games"."id"');
const gameIdOf = (table: "guesses" | "shortlists") => sql.raw(`"${table}"."game_id"`);
const PLAYER_ID = sql.raw('"games"."player_person_id"');
const COLLECTOR_ID = sql.raw('"collections"."collector_person_id"');

/** One aggregate per game: the player's stickers and the latest sign of life. */
export async function listGameActivity(): Promise<GameActivity[]> {
  const lastActiveAt = sql<Date | null>`greatest(
    (select max(greatest("collections"."created_at", "collections"."updated_at")) from "collections" where ${COLLECTOR_ID} = ${PLAYER_ID}),
    (select max("guesses"."created_at") from "guesses" where ${gameIdOf("guesses")} = ${GAME_ID}),
    (select max("shortlists"."created_at") from "shortlists" where ${gameIdOf("shortlists")} = ${GAME_ID})
  )`.mapWith((value) => (value === null ? null : new Date(value)));
  return db
    .select({
      gameId: games.id,
      collected:
        sql<number>`(select count(*) from "collections" where ${COLLECTOR_ID} = ${PLAYER_ID})`.mapWith(
          Number,
        ),
      lastActiveAt,
    })
    .from(games);
}
