import "server-only";
import { AppError, isUniqueViolation, PG_CODES } from "@inbeat/core/errors";
import { and, eq, isNull, sql } from "drizzle-orm";
import { clues, games, people, teams, welcomerClues } from "@/db/schema";
import { todayInGameZone } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { findActiveWelcomerGame } from "@/shared/lib/find-active-welcomer-game";
import { chooseWelcomer, NO_WELCOMER_FREE } from "./choose-welcomer";
import { listActiveWelcomerIds, revealExpiredGames } from "./game-records";
import { listWelcomerCandidates } from "./people-records";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type BeginMissionInput = {
  /** Normalized; the legacy `games.player_email` column is still required. */
  playerEmail: string;
  /** The player's person row, whether or not they have signed in. */
  playerPersonId: string;
  createdBy: string | null;
  now: Date;
  random?: () => number;
};

// A lost race on the welcomer index, a welcomer deleted by a leaver between the pick and the
// insert, or a pick that turned out to welcome the player's own player, re-reads who is busy and
// picks once more; a second loss means the pool is too tight to
// keep guessing.
const MAX_PICKS = 2;
const WELCOMER_FOREIGN_KEY = "games_welcomer_person_id_people_id_fk";

// A leaver can delete the chosen welcomer before the insert; any other missing row is a real error.
function welcomerRowDeleted(err: unknown): boolean {
  for (let cause = err; cause && typeof cause === "object"; ) {
    const { code, constraint } = cause as { code?: string; constraint?: string };
    if (code === PG_CODES.foreignKeyViolation) return constraint === WELCOMER_FOREIGN_KEY;
    cause = (cause as { cause?: unknown }).cause;
  }
  return false;
}

// Starts are rare (one per person, ever), so they queue behind one lock instead of each
// reasoning about the others' half-written state.
const START_LOCK_KEY = 7_302_026;

export const ALREADY_HAS_MISSION = "They already have a mission.";

class MutualWelcoming extends Error {}

/** Mission starts and person removals queue behind one lock, held until the transaction ends. */
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
 * team name is frozen for clue 1, their name and photo for the reveal, and their three clues are copied into the game. The copies keep
 * a welcomer's later edits from changing what this player reads or sees at the reveal.
 */
export async function beginMissionRecord({
  playerEmail,
  playerPersonId,
  createdBy,
  now,
  random,
}: BeginMissionInput) {
  // The active-welcomer index holds a welcomer until their game is revealed, so a mission that
  // ran past day 14 must end before its welcomer can be picked again.
  await revealExpiredGames(now);

  for (let pick = 1; pick <= MAX_PICKS; pick++) {
    const welcomed = await findActiveWelcomerGame(playerPersonId, now);
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
        now,
      });
    } catch (err) {
      const lostWelcomer = isUniqueViolation(err) || welcomerRowDeleted(err);
      if (!lostWelcomer && !(err instanceof MutualWelcoming)) throw err;
    }
  }
  throw new AppError("conflict", "welcomer taken twice", { safeMessage: NO_WELCOMER_FREE });
}

type InsertInput = Pick<
  BeginMissionInput,
  "playerEmail" | "playerPersonId" | "createdBy" | "now"
> & {
  welcomerPersonId: string;
  startDate: string;
};

async function insertStartedGame({
  playerEmail,
  playerPersonId,
  createdBy,
  welcomerPersonId,
  startDate,
  now,
}: InsertInput) {
  return db.transaction(async (tx) => {
    await lockMissionStarts(tx);
    if (await welcomesEachOther(tx, { playerPersonId, welcomerPersonId })) {
      throw new MutualWelcoming();
    }

    const [existing] = await tx
      .select({ id: games.id })
      .from(games)
      .where(eq(games.playerPersonId, playerPersonId))
      .limit(1);
    if (existing) {
      throw new AppError("conflict", "person already has a mission", {
        safeMessage: ALREADY_HAS_MISSION,
      });
    }

    const [welcomer] = await tx
      .select({ teamName: teams.name, name: people.name, imageUrl: people.imageUrl })
      .from(people)
      .leftJoin(teams, eq(people.teamId, teams.id))
      .where(eq(people.id, welcomerPersonId));
    const [game] = await tx
      .insert(games)
      .values({
        playerEmail,
        playerPersonId,
        welcomerPersonId,
        startDate,
        welcomerTeamName: welcomer?.teamName ?? null,
        welcomerName: welcomer?.name ?? null,
        welcomerImageUrl: welcomer?.imageUrl ?? null,
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
    await tx.update(people).set({ welcomerLeftAt: null }).where(eq(people.id, playerPersonId));
    // The marker outlives End mission, so no start, manual or automatic, is ever repeated.
    await tx
      .update(people)
      .set({ autoMissionDoneAt: now })
      .where(and(eq(people.id, playerPersonId), isNull(people.autoMissionDoneAt)));
    return { gameId: game.id };
  });
}
