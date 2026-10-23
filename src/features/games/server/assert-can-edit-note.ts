import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";

type EditNoteCheck = {
  game: Pick<Game, "playerPersonId">;
  viewerPersonId: string;
  collected: boolean;
};

/**
 * The player edits the note of any sticker they collected. The notebook is theirs to keep, so
 * it stays editable after a wrong guess and after the game ends.
 */
export function assertCanEditNote({ game, viewerPersonId, collected }: EditNoteCheck) {
  assertCanPlay(game, viewerPersonId);
  if (!collected) throw new AppError("forbidden", "sticker not collected");
}
