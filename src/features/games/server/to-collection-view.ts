import "server-only";
import type { Collection } from "../types";

export type CollectionView = {
  personId: string;
  collectedAt: Date;
  /** Present only for the collector; admins never see the notebook. */
  notebook?: Pick<Collection, "note" | "chatKind">;
};

export function toCollectionView(collection: Collection, viewerPersonId: string): CollectionView {
  const view = { personId: collection.personId, collectedAt: collection.createdAt };
  return collection.collectorPersonId === viewerPersonId
    ? { ...view, notebook: { note: collection.note, chatKind: collection.chatKind } }
    : view;
}
