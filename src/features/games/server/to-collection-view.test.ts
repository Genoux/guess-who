import { describe, expect, it } from "vitest";
import type { Collection } from "../types";
import { toCollectionView } from "./to-collection-view";

const collectedAt = new Date("2026-11-03T10:00:00Z");
const collection: Collection = {
  id: "collection_1",
  gameId: "game_1",
  personId: "teammate",
  note: "Loves night trains",
  chatKind: "coffee",
  createdAt: collectedAt,
  updatedAt: collectedAt,
};
const game = { id: "game_1", playerPersonId: "player" };

describe("toCollectionView", () => {
  it("gives the player their notebook", () => {
    expect(toCollectionView(collection, game, "player")).toEqual({
      personId: "teammate",
      collectedAt,
      notebook: { note: "Loves night trains", chatKind: "coffee" },
    });
  });

  it.each(["admin", "welcomer", "teammate"])("never gives the notebook to %s", (viewer) => {
    expect(toCollectionView(collection, game, viewer)).toEqual({
      personId: "teammate",
      collectedAt,
    });
  });

  it("never gives the notebook through another game", () => {
    const other = { id: "game_2", playerPersonId: "player" };
    expect(toCollectionView(collection, other, "player")).not.toHaveProperty("notebook");
  });
});
