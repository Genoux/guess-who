import "server-only";
import { eq, sql } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";

/** The player finished or skipped the welcome tour; the first time is kept. */
export async function markIntroSeenRecord({
  game,
  viewerPersonId,
  now,
}: {
  game: Pick<Game, "id" | "playerPersonId" | "status">;
  viewerPersonId: string;
  now: Date;
}) {
  assertCanPlay(game, viewerPersonId);
  await db
    .update(games)
    .set({ introSeenAt: sql`coalesce(${games.introSeenAt}, ${now})` })
    .where(eq(games.id, game.id));
}
