import "server-only";
import { eq, sql } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";
import { assertGameOver } from "./assert-game-over";

/** The player opened the welcomer reveal after the game ended; the first time is kept. */
export async function markRevealSeenRecord({
  game,
  viewerPersonId,
  now,
}: {
  game: Pick<Game, "id" | "playerPersonId" | "status">;
  viewerPersonId: string;
  now: Date;
}) {
  assertCanPlay(game, viewerPersonId);
  assertGameOver(game);
  await db
    .update(games)
    .set({ revealSeenAt: sql`coalesce(${games.revealSeenAt}, ${now})` })
    .where(eq(games.id, game.id));
}
