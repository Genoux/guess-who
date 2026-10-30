import { describe, expect, it } from "vitest";
import { canAdvanceFrom, clueNeedsTeam, teamMissing } from "./clue-flow";
import type { DeskClue } from "./desk-clues";

const clue = (number: 1 | 2 | 3 | 4, text: string | null): DeskClue => ({
  number,
  text,
  editable: number > 1,
  locked: false,
});

const withTeam = [clue(1, "Works in Creative."), clue(2, null), clue(3, null), clue(4, null)];
const noTeam = [clue(1, null), clue(2, "Never owned a car."), clue(3, null), clue(4, null)];

describe("clueNeedsTeam", () => {
  it("is only clue 1, and only while it has no text", () => {
    expect(clueNeedsTeam(clue(1, null))).toBe(true);
    expect(clueNeedsTeam(clue(1, "Works in Creative."))).toBe(false);
    expect(clueNeedsTeam(clue(2, null))).toBe(false);
  });
});

describe("teamMissing", () => {
  it("is true when clue 1 cannot be generated yet", () => {
    expect(teamMissing(noTeam)).toBe(true);
    expect(teamMissing(withTeam)).toBe(false);
  });
});

describe("canAdvanceFrom", () => {
  it("stops on clue 1 until the team is set, so clue 1 is never skipped", () => {
    expect(canAdvanceFrom(noTeam, 0)).toBe(false);
  });

  it("lets every step through once there is a team", () => {
    for (const index of [0, 1, 2]) expect(canAdvanceFrom(withTeam, index)).toBe(true);
  });

  it("does not hold back later clues when the viewer is already past clue 1", () => {
    expect(canAdvanceFrom(noTeam, 1)).toBe(true);
  });
});
