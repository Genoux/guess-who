import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import { and, eq } from "drizzle-orm";
import { games, guesses, shortlists } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanGuess } from "./assert-can-guess";
import { hasCollected, hasGuessed } from "./game-records";

type GuessInput = {
  game: Pick<Game, "id" | "playerPersonId" | "welcomerPersonId" | "status">;
  viewerPersonId: string;
  personId: string;
  now: Date;
};

/**
 * "Is it X?" A right guess ends the game as found; a wrong one rules X out and takes them off
 * the maybe list. The answer is only right or wrong, never who the welcomer is.
 */
export async function guessWelcomerRecord({
  game,
  viewerPersonId,
  personId,
  now,
}: GuessInput): Promise<{ correct: boolean }> {
  const [collected, alreadyGuessed] = await Promise.all([
    hasCollected(game.id, personId),
    hasGuessed(game.id, personId),
  ]);
  assertCanGuess({ game, viewerPersonId, collected, alreadyGuessed });
  const correct = personId === game.welcomerPersonId;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(guesses).values({ gameId: game.id, personId, correct });
      if (correct) {
        const [found] = await tx
          .update(games)
          .set({
            status: "found",
            foundAt: now,
            foundWithClues: games.lastReadClue,
            // The in-place celebration on the guessed card is the reveal.
            revealSeenAt: now,
          })
          .where(and(eq(games.id, game.id), eq(games.status, "active")))
          .returning({ id: games.id });
        if (!found) throw new AppError("conflict", "game is not active");
      } else {
        await tx
          .delete(shortlists)
          .where(and(eq(shortlists.gameId, game.id), eq(shortlists.personId, personId)));
      }
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError("conflict", "person already guessed");
    throw err;
  }
  return { correct };
}
