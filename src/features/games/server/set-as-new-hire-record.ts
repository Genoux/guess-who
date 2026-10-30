import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq, or } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { addNewHireRecord } from "./add-new-hire-record";

type SetAsNewHireInput = {
  personId: string;
  adminPersonId: string;
  now: Date;
  /** Start their mission now, or only flag them and let it be turned on later. */
  startMission: boolean;
};

/**
 * Turns someone who signed in into a new hire, with no card or clues asked. With `startMission`
 * they also start a mission, exactly as if they had been added by email; without it they only
 * get the flag, and see the locked home until a mission is turned on. Someone whose mission is
 * over is refused: the flag would lock their card and clues again for good.
 */
export async function setAsNewHireRecord({
  personId,
  adminPersonId,
  now,
  startMission,
}: SetAsNewHireInput): Promise<{ gameId: string | null }> {
  const [person] = await db
    .select({ email: people.email, clerkUserId: people.clerkUserId })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) throw new AppError("not_found", "person missing");
  if (!person.clerkUserId) {
    throw new AppError("forbidden", "person has not signed in", {
      safeMessage: "They haven't signed in yet. Add them by email instead.",
    });
  }
  const played = await db
    .select({ status: games.status })
    .from(games)
    .where(or(eq(games.playerPersonId, personId), eq(games.playerEmail, person.email)));
  if (played.some(({ status }) => status !== "active")) {
    throw new AppError("conflict", "person already played", {
      safeMessage: "They've already played.",
    });
  }
  if (startMission) return addNewHireRecord({ email: person.email, adminPersonId, now });
  await db.update(people).set({ newHire: true }).where(eq(people.id, personId));
  return { gameId: null };
}
