import "server-only";
import type { Person } from "@/db/schema";

/** A sticker the player can collect: a filled, visible card that is not their own. */
export function isInAlbum(
  person: Pick<Person, "id" | "hidden" | "teamId" | "ask">,
  playerPersonId: string | null,
): boolean {
  return (
    person.id !== playerPersonId &&
    !person.hidden &&
    person.teamId !== null &&
    Boolean(person.ask?.trim())
  );
}
