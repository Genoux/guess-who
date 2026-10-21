import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";

type GuessCheck = {
  game: Pick<Game, "playerPersonId" | "status">;
  viewerPersonId: string;
  /** The player has collected the guessed person's sticker in this game. */
  collected: boolean;
  /** The player already guessed this person in this game (a wrong guess rules them out). */
  alreadyGuessed: boolean;
};

export function assertCanGuess({ game, viewerPersonId, collected, alreadyGuessed }: GuessCheck) {
  assertCanPlay(game, viewerPersonId);
  if (game.status !== "active") throw new AppError("conflict", "game is not active");
  if (!collected) throw new AppError("forbidden", "sticker not collected");
  if (alreadyGuessed) throw new AppError("conflict", "person already guessed");
}
