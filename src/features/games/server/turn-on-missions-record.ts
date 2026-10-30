import "server-only";
import { isAppError } from "@inbeat/core/errors";
import { and, eq, inArray, isNotNull, notExists, or, sql } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { CLUE_NUMBERS_TO_WRITE } from "../lib/welcomer-readiness";
import { beginMissionRecord } from "./begin-mission-record";
import { NO_WELCOMER_FREE } from "./choose-welcomer";

type TurnOnMissionsInput = { personIds: readonly string[]; adminPersonId: string; now: Date };

// A teammate has to be able to welcome before they play: a finished card and all three clues.
// A new hire skips this, whether added by email or flagged from No mission.
const WRITTEN_CLUES = sql`(select count(*) from "welcomer_clues" where "welcomer_clues"."person_id" = ${people.id} and btrim("welcomer_clues"."text") <> '')`;

const hasNoFreeWelcomer = (err: unknown) =>
  isAppError(err, "conflict") && err.safeMessage === NO_WELCOMER_FREE;

/**
 * Starts missions for the chosen people who signed in, have none, and can welcome or are new
 * hires; everyone else is skipped. Starts go one by one, each taking a welcomer the next one
 * can no longer have, so whoever finds none free is counted apart and left for another day.
 */
export async function turnOnMissionsRecord({ personIds, adminPersonId, now }: TurnOnMissionsInput) {
  const withoutMission = await db
    .select({ id: people.id, email: people.email })
    .from(people)
    .where(
      and(
        inArray(people.id, [...personIds]),
        isNotNull(people.clerkUserId),
        or(
          eq(people.newHire, true),
          and(
            isNotNull(people.teamId),
            sql`btrim(coalesce(${people.ask}, '')) <> ''`,
            eq(WRITTEN_CLUES, CLUE_NUMBERS_TO_WRITE.length),
          ),
        ),
        notExists(
          db
            .select({ id: games.id })
            .from(games)
            .where(or(eq(games.playerPersonId, people.id), eq(games.playerEmail, people.email))),
        ),
      ),
    );

  let started = 0;
  let skippedNoWelcomer = 0;
  for (const { id, email } of withoutMission) {
    try {
      await beginMissionRecord({
        playerEmail: email,
        playerPersonId: id,
        createdBy: adminPersonId,
        now,
      });
      started += 1;
    } catch (err) {
      if (!hasNoFreeWelcomer(err)) throw err;
      skippedNoWelcomer += 1;
    }
  }
  return { started, skippedNoWelcomer };
}
