import "server-only";
import { and, eq } from "drizzle-orm";
import { games } from "@/db/schema";
import { db } from "./db";
import { finalizeExpiredGameRecord } from "./finalize-expired-game-record";

/** The game the person is welcoming right now; null between games. */
export async function findActiveWelcomerGame(personId: string, now: Date) {
  const [active] = await db
    .select()
    .from(games)
    .where(and(eq(games.welcomerPersonId, personId), eq(games.status, "active")))
    .limit(1);
  if (!active) return null;
  const game = await finalizeExpiredGameRecord(active, now);
  return game.status === "active" ? game : null;
}
