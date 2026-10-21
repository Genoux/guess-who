import "server-only";
import { and, eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import type { Game } from "../types";

/** The viewer's game as player while it is active, if any. */
export async function getActivePlayerGame(): Promise<Game | null> {
  const { person } = await getViewerPerson();
  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.playerPersonId, person.id), eq(games.status, "active")))
    .limit(1);
  return game ?? null;
}
