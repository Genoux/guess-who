import { describe, expect, it } from "vitest";
import { welcomerClueAccess } from "./welcomer-clue-access";

const open = { number: 2, text: null as string | null, over: false, started: false };

describe("welcomerClueAccess", () => {
  it("lets the welcomer write any clue before day 1, saved or not", () => {
    expect(welcomerClueAccess(open)).toEqual({ editable: true, locked: false });
    expect(welcomerClueAccess({ ...open, text: "Saved" })).toEqual({
      editable: true,
      locked: false,
    });
  });

  it("locks a saved clue once the game is playing", () => {
    expect(welcomerClueAccess({ ...open, text: "Saved", started: true })).toEqual({
      editable: false,
      locked: true,
    });
  });

  it("still lets an unwritten clue be written while playing", () => {
    expect(welcomerClueAccess({ ...open, started: true })).toEqual({
      editable: true,
      locked: false,
    });
  });

  it("is read-only, without a lock, once the game is over", () => {
    expect(welcomerClueAccess({ ...open, text: "Saved", started: true, over: true })).toEqual({
      editable: false,
      locked: false,
    });
  });

  it("never edits the generated team clue", () => {
    expect(welcomerClueAccess({ ...open, number: 1 })).toEqual({ editable: false, locked: false });
  });
});
