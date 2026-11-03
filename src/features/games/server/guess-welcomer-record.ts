import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import { and, eq } from "drizzle-orm";
import { games, guesses, shortlists } from "@/db/schema";
import { clearNewHire } from "@/shared/lib/clear-new-hire";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanGuess } from "./assert-can-guess";
import { hasCollected, hasGuessed } from "./game-records";
import { type FoundStats, toFoundStats } from "./to-game-outcome";

type GuessInput = {
  game: Pick<Game, "id" | "playerPersonId" | "welcomerPersonId" | "status" | "startDate">;
  viewerPersonId: string;
  personId: string;
  now: Date;
};

type GuessResult = { correct: false } | ({ correct: true } & FoundStats);

/**
 * "Is it X?" A right guess ends the game as found and answers with the numbers of the find; a
 * wrong one rules X out and takes them off the maybe list. The answer is only right or wrong,
 * never who the welcomer is.
 */
export async function guessWelcomerRecord({
  game,
  viewerPersonId,
  personId,
  now,
}: GuessInput): Promise<GuessResult> {
  const [collected, alreadyGuessed] = await Promise.all([
    hasCollected(viewerPersonId, personId),
    hasGuessed(game.id, personId),
  ]);
  assertCanGuess({ game, viewerPersonId, collected, alreadyGuessed });
  const correct = personId === game.welcomerPersonId;

  try {
    return await db.transaction(async (tx): Promise<GuessResult> => {
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
          .returning({ foundWithClues: games.foundWithClues });
        if (!found) throw new AppError("conflict", "game is not active");
        await clearNewHire([game.playerPersonId], tx);
        return {
          correct: true,
          ...toFoundStats({
            startDate: game.startDate,
            foundAt: now,
            foundWithClues: found.foundWithClues,
          }),
        };
      }
      await tx
        .delete(shortlists)
        .where(and(eq(shortlists.gameId, game.id), eq(shortlists.personId, personId)));
      return { correct: false };
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError("conflict", "person already guessed");
    throw err;
  }
}
