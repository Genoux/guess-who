import "server-only";
import { authorizeAdmin, type Viewer } from "@/shared/lib/auth";
import { syncViewerPerson } from "@/shared/lib/viewer-person";

export type AdminActor = Viewer & { personId: string };

/** `authorize` for admin actions that record who did it: the admin and their `people` row. */
export async function authorizeAdminPerson(): Promise<AdminActor> {
  const viewer = await authorizeAdmin();
  const person = await syncViewerPerson(viewer.userId, viewer.sessionId);
  return { ...viewer, personId: person.id };
}
