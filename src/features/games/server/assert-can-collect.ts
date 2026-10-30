import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Person } from "@/db/schema";
import { isInAlbum } from "./is-in-album";

type CollectCheck = {
  viewerPersonId: string;
  /** The teammate to collect; undefined when the id matches nobody. */
  person: Pick<Person, "id" | "hidden" | "teamId" | "ask"> | undefined;
  alreadyCollected: boolean;
  /** The welcomer of the viewer's running mission: always collectable, so the mission stays winnable. */
  activeWelcomerId: string | null;
};

/**
 * Any teammate collects another's sticker once, mission or not. The welcomer is collected like
 * anyone else, so collecting never tells a player who the welcomer is.
 */
export function assertCanCollect({
  viewerPersonId,
  person,
  alreadyCollected,
  activeWelcomerId,
}: CollectCheck) {
  const inAlbum = person && (isInAlbum(person, viewerPersonId) || person.id === activeWelcomerId);
  if (!inAlbum) {
    throw new AppError("not_found", "person is not in the album");
  }
  if (alreadyCollected) throw new AppError("conflict", "sticker already collected");
}
