import "server-only";
import { authorizeMember } from "@/shared/lib/auth";
import { assertCardUnlocked } from "@/shared/lib/card-access";
import { syncViewerPerson } from "@/shared/lib/viewer-person";
import type { TeammateActor } from "./authorize-collector";

/** `authorize` for writing a clue: a teammate, once their card and clues are open to them. */
export async function authorizeClueWriter(): Promise<TeammateActor> {
  const viewer = await authorizeMember();
  const person = await syncViewerPerson(viewer.userId, viewer.sessionId);
  await assertCardUnlocked(person);
  return { ...viewer, personId: person.id };
}
