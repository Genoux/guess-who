import "server-only";
import { authorizeAdmin } from "@/shared/lib/auth";
import { syncViewerPerson } from "@/shared/lib/viewer-person";
import type { PeopleBoard } from "../lib/people-view";
import { listGameActivity, listPeople } from "../server/people-records";
import { toPeopleBoard } from "../server/to-people-board";

/** Everyone who signed in, plus the emails an admin added, for the admin's People page. */
export async function getPeopleBoard(): Promise<PeopleBoard> {
  const admin = await authorizeAdmin();
  const viewer = await syncViewerPerson(admin.userId, admin.sessionId);
  const [people, activity] = await Promise.all([listPeople(), listGameActivity()]);
  return toPeopleBoard({ people, activity, now: new Date(), viewerPersonId: viewer.id });
}
