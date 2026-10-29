import "server-only";
import { authorizeMember, type Viewer } from "@/shared/lib/auth";
import { syncViewerPerson } from "@/shared/lib/viewer-person";

export type TeammateActor = Viewer & { personId: string };

/** `authorize` for a teammate's own data: the id comes from the session, never from the input. */
export async function authorizeTeammate(): Promise<TeammateActor> {
  const viewer = await authorizeMember();
  const person = await syncViewerPerson(viewer.userId, viewer.sessionId);
  return { ...viewer, personId: person.id };
}
