import "server-only";
import { clues } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { type ClueNumber, clueReleaseAt } from "../lib/game-schedule";
import type { Game } from "../types";
import { assertCanWriteClue } from "./assert-can-write-clue";

type WriteClueInput = {
  game: Pick<Game, "id" | "welcomerPersonId" | "status" | "startDate">;
  viewerPersonId: string;
  number: ClueNumber;
  text: string;
  now: Date;
};

/** Saves the welcomer's clue; it can change until the moment it lands. */
export async function writeClueRecord({ game, viewerPersonId, number, text, now }: WriteClueInput) {
  const releaseAt = clueReleaseAt(game.startDate, number);
  assertCanWriteClue({
    game,
    clue: { gameId: game.id, number, releaseAt },
    viewerPersonId,
    now,
  });
  await db
    .insert(clues)
    .values({ gameId: game.id, number, text, releaseAt })
    .onConflictDoUpdate({ target: [clues.gameId, clues.number], set: { text, releaseAt } });
}
