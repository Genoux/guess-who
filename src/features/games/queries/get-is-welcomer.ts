import "server-only";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { findActiveWelcomerGame } from "../server/find-active-welcomer-game";

/** Whether the viewer is welcoming a new hire right now: it adds the Welcomer tab. */
export async function getIsWelcomer(): Promise<boolean> {
  const { person } = await getViewerPerson();
  return (await findActiveWelcomerGame(person.id, new Date())) !== null;
}
