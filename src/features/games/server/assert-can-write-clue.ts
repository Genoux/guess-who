import "server-only";
import { AppError } from "@inbeat/core/errors";
import { hasStarted } from "../lib/new-hire-progress";
import type { Game } from "../types";

/** Clue 1 is the teammate's team and is never written by hand. */
const FIRST_WRITABLE_CLUE = 2;

type ClueWriteCheck = {
  /** The game they are welcoming now, if any. */
  activeGame: Pick<Game, "startDate"> | null;
  number: number;
  /** What they already saved for this clue, if anything. */
  savedText: string | null;
  now: Date;
};

/**
 * A teammate writes their own clues whenever they like, until a game they welcome is playing: then a
 * saved clue is read-only, so the player's card never changes under them, and one never written can
 * still be added.
 */
export function assertCanWriteClue({ activeGame, number, savedText, now }: ClueWriteCheck) {
  if (number < FIRST_WRITABLE_CLUE) throw new AppError("forbidden", "clue is generated");
  if (savedText && activeGame && hasStarted(activeGame.startDate, now)) {
    throw new AppError("forbidden", "saved clue is locked while the game is playing", {
      safeMessage: "Locked while the new hire is playing.",
    });
  }
}
