import "server-only";
import { AppError } from "@inbeat/core/errors";
import { authorizeMember, type Viewer } from "@/shared/lib/auth";
import { finalizeExpiredGameRecord } from "@/shared/lib/finalize-expired-game-record";
import { findPersonByClerkUserId } from "@/shared/lib/person-records";
import type { Game } from "../types";
import { assertCanPlay } from "./assert-can-play";
import { findLatestPlayerGame } from "./game-records";

export type PlayerActor = Viewer & { personId: string; game: Game };

async function findOwnGame() {
  const viewer = await authorizeMember();
  const person = await findPersonByClerkUserId(viewer.userId);
  if (!person) throw new AppError("forbidden", "viewer has no person row");
  const game = await findLatestPlayerGame(person.id);
  if (!game) return { viewer, person, game: undefined };
  assertCanPlay(game, person.id);
  return { viewer, person, game: await finalizeExpiredGameRecord(game, new Date()) };
}

/**
 * `authorize` for the actions of a started mission: the signed-in person and their own game,
 * found from the session. Clients never name the game.
 */
export async function authorizePlayer(): Promise<PlayerActor> {
  const { viewer, person, game } = await findOwnGame();
  if (!game) throw new AppError("forbidden", "viewer has no game");
  return { ...viewer, personId: person.id, game };
}
