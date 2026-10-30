import "server-only";
import { AppError } from "@inbeat/core/errors";

/** The collector edits the note of any sticker they collected; the notebook is theirs to keep. */
export function assertCanEditNote({ collected }: { collected: boolean }) {
  if (!collected) throw new AppError("forbidden", "sticker not collected");
}
