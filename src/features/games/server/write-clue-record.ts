import "server-only";
import { welcomerClues } from "@/db/schema";
import type { ClueNumber } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { assertCanWriteClue } from "./assert-can-write-clue";
import { findActiveWelcomerGame } from "./find-active-welcomer-game";

type WriteClueInput = { personId: string; number: ClueNumber; text: string; now: Date };

/** Saves a teammate's own clue; it stays with them for any mission they are picked for. */
export async function writeClueRecord({ personId, number, text, now }: WriteClueInput) {
  const activeGame = await findActiveWelcomerGame(personId, now);
  assertCanWriteClue({ number, welcoming: activeGame !== null });
  await db
    .insert(welcomerClues)
    .values({ personId, number, text })
    .onConflictDoUpdate({ target: [welcomerClues.personId, welcomerClues.number], set: { text } });
}
