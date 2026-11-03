import "server-only";
import { AppError, isAppError } from "@inbeat/core/errors";
import { and, eq, notExists } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { ALREADY_HAS_MISSION, beginMissionRecord } from "./begin-mission-record";
import { hasNoFreeWelcomer } from "./choose-welcomer";

type StartAsNewHireInput = { personId: string; adminPersonId: string | null; now: Date };

/**
 * Flags a listed person as a new hire and starts their mission now. Someone who already has a
 * mission, running or over, is refused before the flag: it would lock their card and clues again.
 * With no welcomer free the person stays flagged, for a later start. No admin means the
 * start was automatic.
 */
export async function startAsNewHireRecord({ personId, adminPersonId, now }: StartAsNewHireInput) {
  const [person] = await db
    .select({ email: people.email, newHire: people.newHire })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) throw new AppError("not_found", "person missing");
  const played = await db
    .select({ status: games.status })
    .from(games)
    .where(eq(games.playerPersonId, personId))
    .limit(1);
  if (played.length > 0) {
    throw new AppError("conflict", "person already has a mission", {
      safeMessage: ALREADY_HAS_MISSION,
    });
  }

  await db.update(people).set({ newHire: true }).where(eq(people.id, personId));
  try {
    await beginMissionRecord({
      playerEmail: person.email,
      playerPersonId: personId,
      createdBy: adminPersonId,
      now,
    });
    return { started: true };
  } catch (err) {
    if (hasNoFreeWelcomer(err)) return { started: false };
    // A start that slipped in between the check and the flag: undo only our own flag, and never
    // while a game exists, since the winner of the race needs the flag the stale read cannot see.
    if (isAppError(err, "conflict") && err.safeMessage === ALREADY_HAS_MISSION && !person.newHire) {
      await db
        .update(people)
        .set({ newHire: false })
        .where(
          and(
            eq(people.id, personId),
            notExists(
              db.select({ id: games.id }).from(games).where(eq(games.playerPersonId, people.id)),
            ),
          ),
        );
    }
    throw err;
  }
}
