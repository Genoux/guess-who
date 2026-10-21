import "server-only";
import { AppError } from "@inbeat/core/errors";
import { authorizeMember, type Viewer } from "@/shared/lib/auth";
import { findPersonByClerkUserId } from "@/shared/lib/person-records";
import type { Game } from "../types";
import { assertIsWelcomer } from "./assert-is-welcomer";
import { finalizeExpiredGameRecord } from "./finalize-expired-game-record";
import { findLatestWelcomerGame } from "./game-records";

export type WelcomerActor = Viewer & { personId: string; game: Game };

/** `authorize` for welcomer actions: the signed-in person and the game they welcome. */
export async function authorizeWelcomer(): Promise<WelcomerActor> {
  const viewer = await authorizeMember();
  const person = await findPersonByClerkUserId(viewer.userId);
  if (!person) throw new AppError("forbidden", "viewer has no person row");
  const game = await findLatestWelcomerGame(person.id);
  if (!game) throw new AppError("forbidden", "viewer welcomes no game");
  assertIsWelcomer(game, person.id);
  return {
    ...viewer,
    personId: person.id,
    game: await finalizeExpiredGameRecord(game, new Date()),
  };
}
