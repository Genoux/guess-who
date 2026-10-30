import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import { and, eq, or, sql } from "drizzle-orm";
import { clues, games, people, teams, welcomerClues } from "@/db/schema";
import { todayInGameZone } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { chooseWelcomer, NO_WELCOMER_FREE } from "./choose-welcomer";
import { findActiveWelcomerGame } from "./find-active-welcomer-game";
import { listActiveWelcomerIds, revealExpiredGames } from "./game-records";
import { listWelcomerCandidates } from "./people-records";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type BeginMissionInput = {
  /** Normalized. */
  playerEmail: string;
  /** The player's person row; null for an invite that has none yet. */
  playerPersonId: string | null;
  createdBy: string | null;
  now: Date;
  random?: () => number;
  /**
   * Runs in the start transaction, so a refused start undoes it. Returns the person the game is
   * linked to, which an invite that has not signed in leaves null until their first sign-in.
   */
  prepare?: (tx: Transaction) => Promise<string | null>;
};

// A lost race on the welcomer index, or a pick that turned out to welcome the player's own
// player, re-reads who is busy and picks once more; a second loss means the pool is too tight to
// keep guessing.
const MAX_PICKS = 2;

// Starts are rare (one per person, ever), so they queue behind one lock instead of each
// reasoning about the others' half-written state.
const START_LOCK_KEY = 7_302_026;

export const ALREADY_HAS_MISSION = "This email already has a mission.";

class MutualWelcoming extends Error {}

/** Starts and email changes queue behind one lock, held until the transaction ends. */
export async function lockMissionStarts(tx: Transaction) {
  await tx.execute(sql`select pg_advisory_xact_lock(${START_LOCK_KEY})`);
}

/**
 * Whether a running mission already has `welcomerPersonId` playing and `playerPersonId` welcoming
 * them. Two starts at once can each pick the other: the read that told them otherwise happened
 * before either write, so it is checked again behind the lock.
 */
export async function welcomesEachOther(
  tx: Transaction,
  { playerPersonId, welcomerPersonId }: { playerPersonId: string; welcomerPersonId: string },
): Promise<boolean> {
  const [mutual] = await tx
    .select({ id: games.id })
    .from(games)
    .where(
      and(
        eq(games.playerPersonId, welcomerPersonId),
        eq(games.welcomerPersonId, playerPersonId),
        eq(games.status, "active"),
      ),
    )
    .limit(1);
  return mutual !== undefined;
}

/**
 * Starts a person's mission: a random eligible welcomer is picked, day 1 is today, the welcomer's
 * team name is frozen for clue 1, and their three clues are copied into the game. The copies keep
 * a welcomer's later edits from changing what this player reads or sees at the reveal.
 */
export async function beginMissionRecord({
  playerEmail,
  playerPersonId,
  createdBy,
  now,
  random,
  prepare,
}: BeginMissionInput) {
  // The active-welcomer index holds a welcomer until their game is revealed, so a mission that
  // ran past day 14 must end before its welcomer can be picked again.
  await revealExpiredGames(now);

  for (let pick = 1; pick <= MAX_PICKS; pick++) {
    const welcomed = playerPersonId ? await findActiveWelcomerGame(playerPersonId, now) : null;
    const [candidates, busyWelcomerIds] = await Promise.all([
      listWelcomerCandidates(),
      listActiveWelcomerIds(now),
    ]);
    const welcomer = chooseWelcomer({
      people: candidates,
      busyWelcomerIds,
      playerPersonId,
      welcomedPersonId: welcomed?.playerPersonId ?? null,
      random,
    });
    try {
      return await insertStartedGame({
        playerEmail,
        playerPersonId,
        createdBy,
        welcomerPersonId: welcomer.id,
        startDate: todayInGameZone(now),
        prepare,
      });
    } catch (err) {
      if (!isUniqueViolation(err) && !(err instanceof MutualWelcoming)) throw err;
    }
  }
  throw new AppError("conflict", "welcomer taken twice", { safeMessage: NO_WELCOMER_FREE });
}

type InsertInput = Pick<BeginMissionInput, "playerEmail" | "playerPersonId" | "createdBy"> &
  Pick<BeginMissionInput, "prepare"> & { welcomerPersonId: string; startDate: string };

async function insertStartedGame({
  playerEmail,
  playerPersonId,
  createdBy,
  welcomerPersonId,
  startDate,
  prepare,
}: InsertInput) {
  return db.transaction(async (tx) => {
    await lockMissionStarts(tx);
    if (playerPersonId && (await welcomesEachOther(tx, { playerPersonId, welcomerPersonId }))) {
      throw new MutualWelcoming();
    }

    const [existing] = await tx
      .select({ id: games.id })
      .from(games)
      .where(
        or(
          eq(games.playerEmail, playerEmail),
          playerPersonId ? eq(games.playerPersonId, playerPersonId) : undefined,
        ),
      )
      .limit(1);
    if (existing) {
      throw new AppError("conflict", "email already has a mission", {
        safeMessage: ALREADY_HAS_MISSION,
      });
    }

    const [welcomerTeam] = await tx
      .select({ name: teams.name })
      .from(people)
      .leftJoin(teams, eq(people.teamId, teams.id))
      .where(eq(people.id, welcomerPersonId));
    const linkedPersonId = prepare ? await prepare(tx) : playerPersonId;
    const [game] = await tx
      .insert(games)
      .values({
        playerEmail,
        playerPersonId: linkedPersonId,
        welcomerPersonId,
        startDate,
        welcomerTeamName: welcomerTeam?.name ?? null,
        createdBy,
      })
      .returning({ id: games.id });
    if (!game) throw new AppError("unknown", "game insert returned no row");

    const written = await tx
      .select({ number: welcomerClues.number, text: welcomerClues.text })
      .from(welcomerClues)
      .where(eq(welcomerClues.personId, welcomerPersonId));
    const snapshot = written
      .filter(({ text }) => text.trim() !== "")
      .map(({ number, text }) => ({ gameId: game.id, number, text }));
    if (snapshot.length > 0) await tx.insert(clues).values(snapshot);
    return { gameId: game.id };
  });
}
