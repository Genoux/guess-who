import "server-only";
import { and, eq } from "drizzle-orm";
import { collections } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanEditNote } from "./assert-can-edit-note";
import { hasCollected } from "./game-records";

type SaveNoteInput = {
  game: Pick<Game, "id" | "playerPersonId">;
  viewerPersonId: string;
  personId: string;
  note: string;
};

/** Replaces the player's private note on a sticker they collected. */
export async function saveNoteRecord({ game, viewerPersonId, personId, note }: SaveNoteInput) {
  const collected = await hasCollected(game.id, personId);
  assertCanEditNote({ game, viewerPersonId, collected });

  await db
    .update(collections)
    .set({ note })
    .where(and(eq(collections.gameId, game.id), eq(collections.personId, personId)));
}
