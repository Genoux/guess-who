import "server-only";
import { inArray } from "drizzle-orm";
import { people } from "@/db/schema";
import { db } from "./db";

type Writer = Pick<typeof db, "update">;

/**
 * The rite of passage is done: their mission ended, found or revealed, so My card and My clues
 * open. Takes the transaction that ended the game when there is one, so the two never disagree.
 */
export async function clearNewHire(
  playerPersonIds: readonly (string | null)[],
  writer: Writer = db,
) {
  const ids = playerPersonIds.filter((id): id is string => id !== null);
  if (ids.length === 0) return;
  await writer.update(people).set({ newHire: false }).where(inArray(people.id, ids));
}
