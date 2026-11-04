import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { lockMissionStarts } from "./begin-mission-record";
import { revealExpiredGames } from "./game-records";

type RemoveLeaverInput = { deelId: string; now: Date };

/**
 * Deletes a person Deel no longer lists, with everything of theirs, in one transaction. A running
 * mission they welcome is deleted and its player is reset: still flagged as a new hire, marker
 * cleared so an admin can start them again, and `welcomer_left_at` set so People shows why. Their
 * own game goes too (its foreign key restricts). Finished games they welcomed keep their welcomer
 * snapshot while the foreign key sets the id to null; those games' guesses and clues stay.
 */
export async function removeLeaverRecord({ deelId, now }: RemoveLeaverInput): Promise<string> {
  await revealExpiredGames(now);

  return db.transaction(async (tx) => {
    await lockMissionStarts(tx);
    const [person] = await tx
      .select({ id: people.id, email: people.email })
      .from(people)
      .where(eq(people.deelId, deelId))
      .for("update");
    if (!person) return "unknown person";

    const reset = await tx
      .delete(games)
      .where(and(eq(games.welcomerPersonId, person.id), eq(games.status, "active")))
      .returning({ playerPersonId: games.playerPersonId });
    const playerIds = reset.flatMap(({ playerPersonId }) =>
      playerPersonId ? [playerPersonId] : [],
    );
    if (playerIds.length > 0) {
      await tx
        .update(people)
        .set({ autoMissionDoneAt: null, welcomerLeftAt: now })
        .where(inArray(people.id, playerIds));
    }

    await tx
      .delete(games)
      .where(
        or(
          eq(games.playerPersonId, person.id),
          and(isNull(games.playerPersonId), eq(games.playerEmail, person.email)),
        ),
      );
    await tx.delete(people).where(eq(people.id, person.id));
    return "leaver removed";
  });
}
