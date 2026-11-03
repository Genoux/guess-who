import "server-only";
import type { Person } from "@/db/schema";

export type StickerViewer = {
  personId: string;
  /** Stickers the viewer collected in their active game; null when they are not playing one. */
  collectedPersonIds: ReadonlySet<string> | null;
};

type PublicSticker = Pick<Person, "id" | "name" | "teamId" | "stickerNumber" | "ask">;

export type StickerView =
  | (PublicSticker & { locked: true })
  | (PublicSticker &
      Pick<Person, "fact" | "location" | "imageUrl" | "photoKey"> & { locked: false });

export function toStickerView(person: Person, viewer: StickerViewer): StickerView {
  const sticker: PublicSticker = {
    id: person.id,
    name: person.name,
    teamId: person.teamId,
    stickerNumber: person.stickerNumber,
    ask: person.ask,
  };
  const unlocked =
    person.id === viewer.personId ||
    viewer.collectedPersonIds === null ||
    viewer.collectedPersonIds.has(person.id);
  if (!unlocked) return { ...sticker, locked: true };
  return {
    ...sticker,
    locked: false,
    fact: person.fact,
    location: person.location,
    imageUrl: person.imageUrl,
    photoKey: person.photoKey,
  };
}
