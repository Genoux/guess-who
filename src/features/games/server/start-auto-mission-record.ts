import "server-only";
import { isAppError } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { people } from "@/db/schema";
import { joinedRecently } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { ALREADY_HAS_MISSION } from "./begin-mission-record";
import { startAsNewHireRecord } from "./start-as-new-hire-record";

type StartAutoMissionInput = { deelId: string; now: Date };

/**
 * Starts the mission of someone Deel reports active who started within the last 30 days, so a
 * late event for a long-standing teammate never flags them, once per person: the marker is set by
 * any mission start and never cleared by End mission, and the backfill sets it for people already
 * active at go-live. With no welcomer free the person stays flagged and the marker stays null, so
 * a later event retries. Two deliveries at once end up with one mission: the loser meets the
 * game behind the mission-start lock.
 */
export async function startAutoMissionRecord({
  deelId,
  now,
}: StartAutoMissionInput): Promise<string> {
  const [person] = await db
    .select({
      id: people.id,
      autoMissionDoneAt: people.autoMissionDoneAt,
      startDate: people.startDate,
    })
    .from(people)
    .where(eq(people.deelId, deelId));
  if (!person) return "unknown person";
  if (person.autoMissionDoneAt) return "auto mission already done";
  if (!joinedRecently(person.startDate, now)) return "not a recent hire";

  try {
    const { started } = await startAsNewHireRecord({
      personId: person.id,
      adminPersonId: null,
      now,
    });
    return started ? "mission started" : "no welcomer free";
  } catch (error) {
    if (isAppError(error, "conflict") && error.safeMessage === ALREADY_HAS_MISSION) {
      return "already has a mission";
    }
    throw error;
  }
}
