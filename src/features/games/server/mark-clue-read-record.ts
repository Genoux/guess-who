import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq, sql } from "drizzle-orm";
import { games } from "@/db/schema";
import { type ClueNumber, clueReleaseAt } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { isClueOut } from "../lib/game-clues";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";

type MarkClueReadInput = {
  game: Pick<Game, "id" | "playerPersonId" | "startDate" | "status">;
  viewerPersonId: string;
  number: ClueNumber;
  now: Date;
};

/** The player opened a clue that is out; clues land in order, so the highest one read is enough. */
export async function markClueReadRecord({ game, viewerPersonId, number, now }: MarkClueReadInput) {
  assertCanPlay(game, viewerPersonId);
  if (!isClueOut(clueReleaseAt(game.startDate, number), game, now)) {
    throw new AppError("conflict", "clue not released yet");
  }
  await db
    .update(games)
    .set({ lastReadClue: sql`greatest(${games.lastReadClue}, ${number})` })
    .where(eq(games.id, game.id));
}
