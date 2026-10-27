import "server-only";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { findLatestWelcomerGame } from "../server/game-records";

/** Whether the viewer is, or was, the secret welcomer of a game: it adds the Welcomer tab. */
export async function getIsWelcomer(): Promise<boolean> {
  const { person } = await getViewerPerson();
  return (await findLatestWelcomerGame(person.id)) !== undefined;
}
