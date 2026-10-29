import { describe, expect, it } from "vitest";
import { buildDeskClues } from "./desk-clues";

const saved = [
  { number: 2, text: "Has never owned a car." },
  { number: 4, text: "Plays it badly." },
];

describe("buildDeskClues", () => {
  it("is always four clues: the team, then the teammate's own", () => {
    const clues = buildDeskClues({ saved, teamName: "Creative", started: false });
    expect(clues.map(({ number, text }) => [number, text])).toEqual([
      [1, "Works in Creative."],
      [2, "Has never owned a car."],
      [3, null],
      [4, "Plays it badly."],
    ]);
  });

  it("leaves clue 1 empty without a team and never edits it", () => {
    const [first] = buildDeskClues({ saved: [], teamName: null, started: false });
    expect(first).toEqual({ number: 1, text: null, editable: false, locked: false });
  });

  it("lets every own clue be edited while no game is playing", () => {
    const clues = buildDeskClues({ saved, teamName: "Creative", started: false });
    expect(clues.slice(1).every(({ editable, locked }) => editable && !locked)).toBe(true);
  });

  it("locks the saved clues once a game is playing and leaves the unwritten one open", () => {
    const clues = buildDeskClues({ saved, teamName: "Creative", started: true });
    expect(clues.slice(1).map(({ editable, locked }) => [editable, locked])).toEqual([
      [false, true],
      [true, false],
      [false, true],
    ]);
  });
});
