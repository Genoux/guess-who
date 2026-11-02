import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq, or } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";

type SetAsNewHireInput = { personId: string };

/**
 * Flags someone as a new hire, with no card or clues asked; they see the locked home until a
 * mission is turned on. Someone whose mission is over is refused: the flag would lock their card
 * and clues again for good.
 */
export async function setAsNewHireRecord({ personId }: SetAsNewHireInput) {
  const [person] = await db
    .select({ email: people.email })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) throw new AppError("not_found", "person missing");
  const played = await db
    .select({ status: games.status })
    .from(games)
    .where(or(eq(games.playerPersonId, personId), eq(games.playerEmail, person.email)));
  if (played.some(({ status }) => status !== "active")) {
    throw new AppError("conflict", "person already played", {
      safeMessage: "They've already played.",
    });
  }
  await db.update(people).set({ newHire: true }).where(eq(people.id, personId));
}
