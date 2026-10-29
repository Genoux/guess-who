import "server-only";
import { welcomerClues } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { ClueNumber } from "../lib/game-schedule";
import { assertCanWriteClue } from "./assert-can-write-clue";
import { findActiveWelcomerGame } from "./find-active-welcomer-game";
import { listWelcomerClues } from "./game-records";

type WriteClueInput = { personId: string; number: ClueNumber; text: string; now: Date };

/** Saves a teammate's own clue; it stays with them for any game they are picked for. */
export async function writeClueRecord({ personId, number, text, now }: WriteClueInput) {
  const [activeGame, saved] = await Promise.all([
    findActiveWelcomerGame(personId, now),
    listWelcomerClues(personId),
  ]);
  assertCanWriteClue({
    activeGame,
    number,
    savedText: saved.find((clue) => clue.number === number)?.text ?? null,
    now,
  });
  await db
    .insert(welcomerClues)
    .values({ personId, number, text })
    .onConflictDoUpdate({ target: [welcomerClues.personId, welcomerClues.number], set: { text } });
}
