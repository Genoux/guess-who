import "server-only";
import { and, eq, inArray, notExists, or, sql } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { completeCardCondition } from "@/shared/lib/complete-card-condition";
import { db } from "@/shared/lib/db";
import { CLUE_NUMBERS_TO_WRITE } from "../lib/welcomer-readiness";
import { beginMissionRecord } from "./begin-mission-record";
import { hasNoFreeWelcomer } from "./choose-welcomer";

type TurnOnMissionsInput = { personIds: readonly string[]; adminPersonId: string; now: Date };

// A teammate has to be able to welcome before they play: a complete card and all three clues.
// A new hire skips this.
const WRITTEN_CLUES = sql`(select count(*) from "welcomer_clues" where "welcomer_clues"."person_id" = ${people.id} and btrim("welcomer_clues"."text") <> '')`;

/**
 * Starts missions for the chosen people, signed in or not, who have none and can welcome or are
 * new hires; everyone else is skipped. Starts go one by one, each taking a welcomer the next one
 * can no longer have, so whoever finds none free is counted apart and left for another day.
 */
export async function turnOnMissionsRecord({ personIds, adminPersonId, now }: TurnOnMissionsInput) {
  const withoutMission = await db
    .select({ id: people.id, email: people.email })
    .from(people)
    .where(
      and(
        inArray(people.id, [...personIds]),
        or(
          eq(people.newHire, true),
          and(completeCardCondition, eq(WRITTEN_CLUES, CLUE_NUMBERS_TO_WRITE.length)),
        ),
        notExists(
          db.select({ id: games.id }).from(games).where(eq(games.playerPersonId, people.id)),
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
