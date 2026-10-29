import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { games, people, teams } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { GameActivity, NewHireGameRow, WelcomerCandidate } from "./to-new-hire-board";

const player = alias(people, "player");
const welcomer = alias(people, "welcomer");
const creator = alias(people, "creator");

export async function listNewHireGames(): Promise<NewHireGameRow[]> {
  return db
    .select({
      id: games.id,
      playerEmail: games.playerEmail,
      playerPersonId: games.playerPersonId,
      startDate: games.startDate,
      status: games.status,
      foundAt: games.foundAt,
      playerName: player.name,
      creatorName: creator.name,
      welcomerName: welcomer.name,
      welcomerPersonId: games.welcomerPersonId,
      welcomerColor: teams.color,
      welcomerTeam: teams.name,
    })
    .from(games)
    .leftJoin(player, eq(games.playerPersonId, player.id))
    .innerJoin(welcomer, eq(games.welcomerPersonId, welcomer.id))
    .leftJoin(teams, eq(welcomer.teamId, teams.id))
    .leftJoin(creator, eq(games.createdBy, creator.id));
}

/** Every visible teammate with their team and the numbers of the clues they wrote. */
export async function listWelcomerCandidates(): Promise<WelcomerCandidate[]> {
  return db
    .select({
      id: people.id,
      name: people.name,
      email: people.email,
      hidden: people.hidden,
      teamId: people.teamId,
      ask: people.ask,
      team: teams.name,
      color: teams.color,
      writtenClues: sql<number[]>`array(
        select "welcomer_clues"."number" from "welcomer_clues"
        where "welcomer_clues"."person_id" = "people"."id" and btrim("welcomer_clues"."text") <> ''
        order by "welcomer_clues"."number"
      )`.mapWith((value) => (Array.isArray(value) ? value.map(Number) : [])),
    })
    .from(people)
    .leftJoin(teams, eq(people.teamId, teams.id))
    .where(eq(people.hidden, false))
    .orderBy(asc(people.name));
}

// Drizzle drops table names from columns in a one-table select, which would make `id` inside a
// subquery mean the subquery's own table, so the correlated columns are written out.
const GAME_ID = sql.raw('"games"."id"');
const gameIdOf = (table: "collections" | "guesses" | "shortlists") =>
  sql.raw(`"${table}"."game_id"`);

/** One aggregate per game: stickers and the latest sign of life. */
export async function listGameActivity(): Promise<GameActivity[]> {
  const lastActiveAt = sql<Date | null>`greatest(
    (select max(greatest("collections"."created_at", "collections"."updated_at")) from "collections" where ${gameIdOf("collections")} = ${GAME_ID}),
    (select max("guesses"."created_at") from "guesses" where ${gameIdOf("guesses")} = ${GAME_ID}),
    (select max("shortlists"."created_at") from "shortlists" where ${gameIdOf("shortlists")} = ${GAME_ID})
  )`.mapWith((value) => (value === null ? null : new Date(value)));
  return db
    .select({
      gameId: games.id,
      collected:
        sql<number>`(select count(*) from "collections" where ${gameIdOf("collections")} = ${GAME_ID})`.mapWith(
          Number,
        ),
      lastActiveAt,
    })
    .from(games);
}
