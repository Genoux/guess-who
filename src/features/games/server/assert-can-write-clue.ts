import "server-only";
import { AppError } from "@inbeat/core/errors";

/** Clue 1 is the teammate's team and is never written by hand. */
const FIRST_WRITABLE_CLUE = 2;

type ClueWriteCheck = {
  number: number;
  /** They welcome a mission that is playing. */
  welcoming: boolean;
};

/**
 * A teammate writes their own clues whenever they like, until they welcome a started mission:
 * then every clue is read-only, so the player never meets a clue that moved.
 */
export function assertCanWriteClue({ number, welcoming }: ClueWriteCheck) {
  if (number < FIRST_WRITABLE_CLUE) throw new AppError("forbidden", "clue is generated");
  if (welcoming) {
    throw new AppError("forbidden", "clues are locked while their mission is playing", {
      safeMessage: "Locked while the new hire is playing.",
    });
  }
}
