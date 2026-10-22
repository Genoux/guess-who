import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";

type ShortlistCheck = {
  game: Pick<Game, "playerPersonId" | "status">;
  viewerPersonId: string;
  collected: boolean;
  /** A wrong guess already ruled this person out. */
  ruled: boolean;
};

/** The maybe list holds collected, not ruled out stickers of the player's active game. */
export function assertCanShortlist({ game, viewerPersonId, collected, ruled }: ShortlistCheck) {
  assertCanPlay(game, viewerPersonId);
  if (game.status !== "active") throw new AppError("conflict", "game is not active");
  if (!collected) throw new AppError("forbidden", "sticker not collected");
  if (ruled) throw new AppError("conflict", "person already ruled out");
}
