import { describe, expect, it } from "vitest";
import type { Game } from "../types";
import type { BoardSticker, PlayerBoard } from "./load-player-board";
import { toGameOutcome } from "./to-game-outcome";

const welcomer: BoardSticker = {
  id: "welcomer",
  teamId: "creative",
  name: "Maya Okafor",
  firstName: "Maya",
  person: { name: "Maya Okafor" } as BoardSticker["person"],
  mode: "collected",
  collected: false,
  shortlisted: false,
  ruled: false,
  note: null,
};

const board = (
  status: Game["status"],
  revealedWelcomer: BoardSticker | null = welcomer,
  revealSeenAt: Date | null = null,
): Pick<PlayerBoard, "game" | "startDate" | "welcomer"> => ({
  game: {
    id: "game_1",
    status,
    startDate: "2026-11-02",
    foundAt: status === "found" ? new Date("2026-11-07T15:00:00Z") : null,
    foundWithClues: status === "found" ? 1 : null,
    revealSeenAt,
    welcomerPersonId: status === "active" ? null : "welcomer",
  },
  startDate: "2026-11-02",
  welcomer: revealedWelcomer,
});

describe("toGameOutcome", () => {
  it("is not over while the game is active", () => {
    expect(toGameOutcome(board("active", null))).toEqual({ over: false });
  });

  it("is not over without a revealed welcomer", () => {
    expect(toGameOutcome(board("found", null))).toEqual({ over: false });
  });

  it("reports the day and the clues read when the welcomer was found", () => {
    expect(toGameOutcome(board("found"))).toEqual({
      over: true,
      found: true,
      welcomer: { firstName: "Maya", person: welcomer.person, mode: "collected" },
      foundOnDay: 6,
      cluesUsed: 1,
      revealSeen: false,
    });
  });

  it("reports the reveal as seen once the player saw it", () => {
    expect(toGameOutcome(board("revealed", welcomer, new Date()))).toMatchObject({
      revealSeen: true,
    });
  });

  it("reports no day and no clues when revealed on day 14", () => {
    expect(toGameOutcome(board("revealed"))).toMatchObject({
      over: true,
      found: false,
      foundOnDay: null,
      cluesUsed: null,
    });
  });
});
