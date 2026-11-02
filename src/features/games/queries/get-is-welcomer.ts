import "server-only";
import { findActiveWelcomerGame } from "@/shared/lib/find-active-welcomer-game";
import { getViewerPerson } from "@/shared/lib/viewer-person";

/** Whether the viewer is welcoming a new hire right now: it adds the Welcomer tab. */
export async function getIsWelcomer(): Promise<boolean> {
  const { person } = await getViewerPerson();
  return (await findActiveWelcomerGame(person.id, new Date())) !== null;
}
