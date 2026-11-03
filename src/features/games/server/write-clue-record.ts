import "server-only";
import { and, eq } from "drizzle-orm";
import { welcomerClues } from "@/db/schema";
import type { ClueNumber } from "@/entities/game-schedule";
import { db } from "@/shared/lib/db";
import { findActiveWelcomerGame } from "@/shared/lib/find-active-welcomer-game";
import { assertCanWriteClue } from "./assert-can-write-clue";

type WriteClueInput = { personId: string; number: ClueNumber; text: string; now: Date };

/**
 * Saves a teammate's own clue; it stays with them for any mission they are picked for. A blank
 * text removes it, so a clue is either written or absent.
 */
export async function writeClueRecord({ personId, number, text, now }: WriteClueInput) {
  const activeGame = await findActiveWelcomerGame(personId, now);
  assertCanWriteClue({ number, welcoming: activeGame !== null });
  if (!text.trim()) {
    await db
      .delete(welcomerClues)
      .where(and(eq(welcomerClues.personId, personId), eq(welcomerClues.number, number)));
    return;
  }
  await db
    .insert(welcomerClues)
    .values({ personId, number, text })
    .onConflictDoUpdate({ target: [welcomerClues.personId, welcomerClues.number], set: { text } });
}
