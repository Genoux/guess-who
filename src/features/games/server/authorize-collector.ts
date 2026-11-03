import "server-only";
import { AppError } from "@inbeat/core/errors";
import { missionPhase } from "@/entities/mission-phase";
import { isLockedNewHire, LOCKED_MESSAGE } from "@/entities/new-hire";
import { authorizeMember, type Viewer } from "@/shared/lib/auth";
import { syncViewerPerson } from "@/shared/lib/viewer-person";
import { findLatestPlayerGame } from "./game-records";

export type TeammateActor = Viewer & { personId: string };

/**
 * `authorize` for collecting a sticker and saving a note: a teammate's own data, with the id from
 * the session. A new hire with no running mission has no album to collect into.
 */
export async function authorizeCollector(): Promise<TeammateActor> {
  const viewer = await authorizeMember();
  const person = await syncViewerPerson(viewer.userId, viewer.sessionId);
  if (isLockedNewHire(person)) {
    const phase = missionPhase(await findLatestPlayerGame(person.id), new Date());
    if (phase !== "playing") {
      throw new AppError("forbidden", "a new hire has no album without a mission", {
        safeMessage: LOCKED_MESSAGE,
      });
    }
  }
  return { ...viewer, personId: person.id };
}
