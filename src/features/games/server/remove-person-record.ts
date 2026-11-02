import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq, isNull, or } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { lockMissionStarts } from "./begin-mission-record";
import { revealExpiredGames } from "./game-records";

type RemovePersonInput = { personId: string; actorPersonId: string; now: Date };

/**
 * Deletes a person and everything of theirs, in one transaction. The games they played or welcomed
 * go first (both foreign keys restrict); clues, guesses and shortlists leave with their game, and
 * their albums, stickers, notes and welcomer clues cascade from the person. A running mission
 * refuses it: an admin ends that first.
 */
export async function removePersonRecord({ personId, actorPersonId, now }: RemovePersonInput) {
  if (personId === actorPersonId) {
    throw new AppError("forbidden", "admin removing themselves", {
      safeMessage: "You can't remove yourself.",
    });
  }
  await revealExpiredGames(now);

  await db.transaction(async (tx) => {
    await lockMissionStarts(tx);
    const [person] = await tx
      .select({ email: people.email })
      .from(people)
      .where(eq(people.id, personId));
    if (!person) throw new AppError("not_found", "person missing");

    const theirGames = or(
      eq(games.playerPersonId, personId),
      eq(games.welcomerPersonId, personId),
      and(isNull(games.playerPersonId), eq(games.playerEmail, person.email)),
    );
    const [running] = await tx
      .select({ id: games.id })
      .from(games)
      .where(and(theirGames, eq(games.status, "active")))
      .limit(1);
    if (running) {
      throw new AppError("conflict", "person has a running mission", {
        safeMessage: "End their mission first.",
      });
    }

    await tx.delete(games).where(theirGames);
    await tx.delete(people).where(eq(people.id, personId));
  });
}
