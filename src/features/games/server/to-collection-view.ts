import "server-only";
import type { Collection, Game } from "../types";

export type CollectionView = {
  personId: string;
  collectedAt: Date;
  /** Present only for the game's player; admins never see the notebook. */
  notebook?: Pick<Collection, "note" | "chatKind">;
};

export function toCollectionView(
  collection: Collection,
  game: Pick<Game, "id" | "playerPersonId">,
  viewerPersonId: string,
): CollectionView {
  const view = { personId: collection.personId, collectedAt: collection.createdAt };
  const isPlayer = collection.gameId === game.id && game.playerPersonId === viewerPersonId;
  return isPlayer
    ? { ...view, notebook: { note: collection.note, chatKind: collection.chatKind } }
    : view;
}
