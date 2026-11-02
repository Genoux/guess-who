import "server-only";
import { AppError } from "@inbeat/core/errors";
import { and, eq, isNull, or } from "drizzle-orm";
import { games, people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { lockMissionStarts } from "./begin-mission-record";
import { revealExpiredGames } from "./game-records";

type RemovePersonInput = { personId: string; actorPersonId: string; now: Date };

/**
 * Deletes a person and everything of theirs, in one transaction. The game they played goes first
 * (its foreign key restricts); clues, guesses and shortlists leave with it, and their albums,
 * stickers, notes and welcomer clues cascade from the person. Anyone who welcomed a mission is
 * refused: the game is another player's record, and a running one is ended by an admin first.
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

    const [welcomed] = await tx
      .select({ id: games.id })
      .from(games)
      .where(eq(games.welcomerPersonId, personId))
      .limit(1);
    if (welcomed) {
      throw new AppError("conflict", "person welcomed a mission", {
        safeMessage: "They welcomed a mission, so they can't be removed.",
      });
    }

    const theirGames = or(
      eq(games.playerPersonId, personId),
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
