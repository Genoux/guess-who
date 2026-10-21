import "server-only";
import { AppError } from "@inbeat/core/errors";
import { collections } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanCollect } from "./assert-can-collect";
import { findPersonById, hasCollected } from "./game-records";

type CollectInput = {
  game: Pick<Game, "id" | "playerPersonId" | "status">;
  viewerPersonId: string;
  personId: string;
  /** One thing the player learned; private to the player. */
  note: string;
};

/** Sticks a teammate into the player's album with their private note. */
export async function collectStickerRecord({ game, viewerPersonId, personId, note }: CollectInput) {
  const [person, alreadyCollected] = await Promise.all([
    findPersonById(personId),
    hasCollected(game.id, personId),
  ]);
  assertCanCollect({ game, viewerPersonId, person, alreadyCollected });

  const [collection] = await db
    .insert(collections)
    .values({ gameId: game.id, personId, note })
    .onConflictDoNothing({ target: [collections.gameId, collections.personId] })
    .returning({ id: collections.id });
  if (!collection) throw new AppError("conflict", "sticker already collected");
}
