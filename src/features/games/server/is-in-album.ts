import "server-only";
import type { Person } from "@/db/schema";
import { isCardComplete } from "@/entities/card";

/** A sticker the player can collect: a complete, visible card that is not their own. */
export function isInAlbum(
  person: Pick<Person, "id" | "hidden" | "teamId" | "location" | "fact" | "ask">,
  playerPersonId: string | null,
): boolean {
  return person.id !== playerPersonId && !person.hidden && isCardComplete(person);
}
