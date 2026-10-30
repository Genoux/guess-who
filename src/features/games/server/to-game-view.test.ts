import { describe, expect, it } from "vitest";
import type { Game, GameViewer } from "../types";
import { toGameView } from "./to-game-view";

const game = (status: Game["status"]): Game => ({
  id: "game_1",
  playerPersonId: "player",
  playerEmail: "new.hire@inbeat.agency",
  welcomerPersonId: "welcomer",
  startDate: "2026-11-02",
  welcomerTeamName: null,
  status,
  foundAt: null,
  foundWithClues: null,
  introSeenAt: null,
  revealSeenAt: null,
  lastReadClue: 0,
  createdBy: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const player: GameViewer = { personId: "player", role: "member" };

describe("toGameView", () => {
  it("hides the welcomer from the player while the game is active", () => {
    expect(toGameView(game("active"), player).welcomerPersonId).toBeNull();
  });

  it("hides the welcomer from a player who is also an admin", () => {
    expect(toGameView(game("active"), { ...player, role: "admin" }).welcomerPersonId).toBeNull();
  });

  it("hides the welcomer from other teammates", () => {
    const view = toGameView(game("active"), { personId: "teammate", role: "member" });
    expect(view.welcomerPersonId).toBeNull();
  });

  it.each(["found", "revealed"] as const)("shows the welcomer once the game is %s", (status) => {
    expect(toGameView(game(status), player).welcomerPersonId).toBe("welcomer");
  });

  it("shows the welcomer to the welcomer and to admins", () => {
    expect(
      toGameView(game("active"), { personId: "welcomer", role: "member" }).welcomerPersonId,
    ).toBe("welcomer");
    expect(toGameView(game("active"), { personId: "admin", role: "admin" }).welcomerPersonId).toBe(
      "welcomer",
    );
  });

  it("never exposes the player email", () => {
    expect(toGameView(game("active"), player)).not.toHaveProperty("playerEmail");
  });
});
