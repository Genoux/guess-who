import { describe, expect, it } from "vitest";
import { isInAlbum } from "./is-in-album";

const card = { id: "teammate", hidden: false, teamId: "team_1", ask: "Night trains" };

describe("isInAlbum", () => {
  it("includes a filled, visible card", () => {
    expect(isInAlbum(card, "player")).toBe(true);
  });

  it("leaves out the player's own card", () => {
    expect(isInAlbum({ ...card, id: "player" }, "player")).toBe(false);
  });

  it("leaves out hidden people", () => {
    expect(isInAlbum({ ...card, hidden: true }, "player")).toBe(false);
  });

  it.each([{ teamId: null }, { ask: null }, { ask: "   " }])(
    "leaves out an unfinished card (%o)",
    (missing) => {
      expect(isInAlbum({ ...card, ...missing }, "player")).toBe(false);
    },
  );
});
