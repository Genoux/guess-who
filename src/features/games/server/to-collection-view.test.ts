import { describe, expect, it } from "vitest";
import type { Collection } from "../types";
import { toCollectionView } from "./to-collection-view";

const collectedAt = new Date("2026-11-03T10:00:00Z");
const collection: Collection = {
  id: "collection_1",
  collectorPersonId: "collector",
  personId: "teammate",
  note: "Loves night trains",
  chatKind: "coffee",
  createdAt: collectedAt,
  updatedAt: collectedAt,
};

describe("toCollectionView", () => {
  it("gives the collector their notebook", () => {
    expect(toCollectionView(collection, "collector")).toEqual({
      personId: "teammate",
      collectedAt,
      notebook: { note: "Loves night trains", chatKind: "coffee" },
    });
  });

  it.each(["admin", "welcomer", "teammate"])("never gives the notebook to %s", (viewer) => {
    expect(toCollectionView(collection, viewer)).toEqual({ personId: "teammate", collectedAt });
  });
});
