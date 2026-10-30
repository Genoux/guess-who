import "server-only";
import { and, eq } from "drizzle-orm";
import { shortlists } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanShortlist } from "./assert-can-shortlist";
import { hasCollected, hasGuessed } from "./game-records";

type ShortlistInput = {
  game: Pick<Game, "id" | "playerPersonId" | "status">;
  viewerPersonId: string;
  personId: string;
  /** Put the person on the maybe list, or take them off it. */
  on: boolean;
};

export async function setShortlistRecord({ game, viewerPersonId, personId, on }: ShortlistInput) {
  // While the game is active every guess was wrong, so a guessed person is ruled out.
  const [collected, ruled] = await Promise.all([
    hasCollected(viewerPersonId, personId),
    hasGuessed(game.id, personId),
  ]);
  assertCanShortlist({ game, viewerPersonId, collected, ruled });

  if (on) {
    await db
      .insert(shortlists)
      .values({ gameId: game.id, personId })
      .onConflictDoNothing({ target: [shortlists.gameId, shortlists.personId] });
  } else {
    await db
      .delete(shortlists)
      .where(and(eq(shortlists.gameId, game.id), eq(shortlists.personId, personId)));
  }
}
