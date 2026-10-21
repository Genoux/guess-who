import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Clue, Game } from "../types";

/** Clue 1 is the welcomer's team and is never written by hand. */
const FIRST_WRITABLE_CLUE = 2;

type ClueWriteCheck = {
  game: Pick<Game, "id" | "welcomerPersonId" | "status">;
  clue: Pick<Clue, "gameId" | "number" | "releaseAt">;
  viewerPersonId: string;
  now: Date;
};

export function assertCanWriteClue({ game, clue, viewerPersonId, now }: ClueWriteCheck) {
  if (game.welcomerPersonId !== viewerPersonId) {
    throw new AppError("forbidden", "viewer is not the welcomer of this game");
  }
  if (clue.gameId !== game.id) throw new AppError("forbidden", "clue belongs to another game");
  if (game.status !== "active") throw new AppError("conflict", "game is not active");
  if (clue.number < FIRST_WRITABLE_CLUE) throw new AppError("forbidden", "clue is generated");
  if (now >= clue.releaseAt) throw new AppError("conflict", "clue already released");
}
