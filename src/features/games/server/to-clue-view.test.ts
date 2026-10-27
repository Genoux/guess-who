import { describe, expect, it } from "vitest";
import type { Clue, GameViewer } from "../types";
import { toClueView } from "./to-clue-view";

const releaseAt = new Date("2026-11-06T13:00:00Z");
const clue: Clue = {
  id: "clue_2",
  gameId: "game_1",
  number: 2,
  text: "I have climbed a volcano",
  releaseAt,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const game = { playerPersonId: "player", welcomerPersonId: "welcomer", status: "active" as const };
const before = new Date("2026-11-06T12:59:59Z");

const view = (viewer: GameViewer, now: Date) => toClueView(clue, game, viewer, now);

describe("toClueView", () => {
  it("hides the text from the player before release", () => {
    expect(view({ personId: "player", role: "member" }, before)).toMatchObject({
      released: false,
      text: null,
      number: 2,
    });
  });

  it("hides the text from a player who is also an admin", () => {
    expect(view({ personId: "player", role: "admin" }, before).text).toBeNull();
  });

  it("hides the text from other teammates before release", () => {
    expect(view({ personId: "teammate", role: "member" }, before).text).toBeNull();
  });

  it("shows the text to the player at release time", () => {
    expect(view({ personId: "player", role: "member" }, releaseAt)).toMatchObject({
      released: true,
      text: "I have climbed a volcano",
    });
  });

  it("shows drafts to the welcomer and admins", () => {
    expect(view({ personId: "welcomer", role: "member" }, before).text).toBe(
      "I have climbed a volcano",
    );
    expect(view({ personId: "admin", role: "admin" }, before).text).toBe(
      "I have climbed a volcano",
    );
  });

  it("releases every clue to the player once the game is over", () => {
    const ended = { ...game, status: "found" as const };
    expect(toClueView(clue, ended, { personId: "player", role: "member" }, before)).toMatchObject({
      released: true,
      text: "I have climbed a volcano",
    });
  });
});
