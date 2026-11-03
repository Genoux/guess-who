import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { games, type Person } from "@/db/schema";
import { isLockedNewHire, LOCKED_MESSAGE } from "@/entities/new-hire";
import { db } from "./db";
import { finalizeExpiredGameRecord } from "./finalize-expired-game-record";

/**
 * The card and clue actions' guard: a new hire has not earned them yet. Same rule as the tabs. A
 * mission that ran past day 14 is ended first, which clears the flag, so a new hire whose time ran
 * out is unlocked right away instead of at their next album visit.
 */
export async function assertCardUnlocked(person: Pick<Person, "id" | "newHire">) {
  if (!isLockedNewHire(person)) return;
  const [game] = await db.select().from(games).where(eq(games.playerPersonId, person.id));
  const current = game ? await finalizeExpiredGameRecord(game, new Date()) : null;
  if (current && current.status !== "active") return;
  throw new AppError("forbidden", "card and clues are closed until the mission is done", {
    safeMessage: LOCKED_MESSAGE,
  });
}
