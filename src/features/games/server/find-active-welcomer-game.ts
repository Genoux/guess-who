import "server-only";
import { finalizeExpiredGameRecord } from "@/shared/lib/finalize-expired-game-record";
import type { Game } from "../types";
import { findLatestWelcomerGame } from "./game-records";

/** The game the person is welcoming right now; null between games. */
export async function findActiveWelcomerGame(personId: string, now: Date): Promise<Game | null> {
  const latest = await findLatestWelcomerGame(personId);
  if (!latest) return null;
  const game = await finalizeExpiredGameRecord(latest, now);
  return game.status === "active" ? game : null;
}
