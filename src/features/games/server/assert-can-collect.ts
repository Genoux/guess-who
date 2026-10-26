import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Person } from "@/db/schema";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";
import { isInAlbum } from "./is-in-album";

type CollectCheck = {
  game: Pick<Game, "playerPersonId">;
  viewerPersonId: string;
  /** The teammate to collect; undefined when the id matches nobody. */
  person: Pick<Person, "id" | "hidden" | "teamId" | "ask"> | undefined;
  alreadyCollected: boolean;
};

/**
 * The player collects a teammate's sticker once, during the game and after it: the album is
 * theirs to finish. The welcomer is collected like anyone else, so collecting never tells the
 * player who the welcomer is.
 */
export function assertCanCollect({ game, viewerPersonId, person, alreadyCollected }: CollectCheck) {
  assertCanPlay(game, viewerPersonId);
  if (!person || !isInAlbum(person, viewerPersonId)) {
    throw new AppError("not_found", "person is not in the album");
  }
  if (alreadyCollected) throw new AppError("conflict", "sticker already collected");
}
