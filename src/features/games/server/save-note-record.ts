import "server-only";
import { and, eq } from "drizzle-orm";
import { collections } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { assertCanEditNote } from "./assert-can-edit-note";
import { hasCollected } from "./game-records";

type SaveNoteInput = { viewerPersonId: string; personId: string; note: string };

/** Replaces the viewer's private note on a sticker they collected. */
export async function saveNoteRecord({ viewerPersonId, personId, note }: SaveNoteInput) {
  assertCanEditNote({ collected: await hasCollected(viewerPersonId, personId) });

  await db
    .update(collections)
    .set({ note })
    .where(
      and(eq(collections.collectorPersonId, viewerPersonId), eq(collections.personId, personId)),
    );
}
