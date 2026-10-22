import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Person } from "@/db/schema";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";
import { isInAlbum } from "./is-in-album";

type CollectCheck = {
  game: Pick<Game, "playerPersonId" | "status">;
  viewerPersonId: string;
  /** The teammate to collect; undefined when the id matches nobody. */
  person: Pick<Person, "id" | "hidden" | "teamId" | "ask"> | undefined;
  alreadyCollected: boolean;
};

/**
 * The player collects a teammate's sticker once, while the game is active. The welcomer is
 * collected like anyone else, so collecting never tells the player who the welcomer is.
 */
export function assertCanCollect({ game, viewerPersonId, person, alreadyCollected }: CollectCheck) {
  assertCanPlay(game, viewerPersonId);
  if (game.status !== "active") throw new AppError("conflict", "game is not active");
  if (!person || !isInAlbum(person, viewerPersonId)) {
    throw new AppError("not_found", "person is not in the album");
  }
  if (alreadyCollected) throw new AppError("conflict", "sticker already collected");
}
