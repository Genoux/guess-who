import "server-only";
import { and, eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { isPastReveal } from "@/entities/game-schedule";
import { clearNewHire } from "./clear-new-hire";
import { db } from "./db";
import { logger } from "./logger";

type Game = typeof games.$inferSelect;

/**
 * Ends an active game as revealed once day 14 has come. Only an active game changes, so a game
 * found a moment earlier stays found.
 */
// shortcut: runs on read (player and welcomer pages and actions); phase 6 moves it to the daily
// cron, which also queues the game.revealed event in the n8n outbox.
export async function finalizeExpiredGameRecord(game: Game, now: Date): Promise<Game> {
  if (game.status !== "active" || !isPastReveal(game.startDate, now)) {
    return game;
  }
  const [revealed] = await db
    .update(games)
    .set({ status: "revealed" })
    .where(and(eq(games.id, game.id), eq(games.status, "active")))
    .returning();
  if (revealed) {
    await clearNewHire([game.playerPersonId]);
    logger.info("game revealed", { gameId: game.id });
    return revealed;
  }
  const [current] = await db.select().from(games).where(eq(games.id, game.id));
  return current ?? game;
}
