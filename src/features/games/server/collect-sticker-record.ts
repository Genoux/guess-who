import "server-only";
import { AppError } from "@inbeat/core/errors";
import { collections } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { assertCanCollect } from "./assert-can-collect";
import { findLatestPlayerGame, findPersonById, hasCollected } from "./game-records";

type CollectInput = {
  viewerPersonId: string;
  personId: string;
  /** One thing the collector learned; private to them. */
  note: string;
};

/** Sticks a teammate into the viewer's album with their private note. */
export async function collectStickerRecord({ viewerPersonId, personId, note }: CollectInput) {
  const [person, alreadyCollected, game] = await Promise.all([
    findPersonById(personId),
    hasCollected(viewerPersonId, personId),
    findLatestPlayerGame(viewerPersonId),
  ]);
  const activeWelcomerId = game?.status === "active" ? game.welcomerPersonId : null;
  assertCanCollect({ viewerPersonId, person, alreadyCollected, activeWelcomerId });

  const [collection] = await db
    .insert(collections)
    .values({ collectorPersonId: viewerPersonId, personId, note })
    .onConflictDoNothing({ target: [collections.collectorPersonId, collections.personId] })
    .returning({ id: collections.id });
  if (!collection) throw new AppError("conflict", "sticker already collected");
}
