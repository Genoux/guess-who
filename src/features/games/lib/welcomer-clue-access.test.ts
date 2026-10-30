import { describe, expect, it } from "vitest";
import { welcomerClueAccess } from "./welcomer-clue-access";

describe("welcomerClueAccess", () => {
  it("lets a teammate write their own clues while they welcome nobody", () => {
    expect(welcomerClueAccess({ number: 2, welcoming: false })).toEqual({
      editable: true,
      locked: false,
    });
  });

  it("locks their clues while they welcome a started mission", () => {
    expect(welcomerClueAccess({ number: 3, welcoming: true })).toEqual({
      editable: false,
      locked: true,
    });
  });

  it("never edits the generated team clue, and never shows it locked", () => {
    expect(welcomerClueAccess({ number: 1, welcoming: false })).toEqual({
      editable: false,
      locked: false,
    });
    expect(welcomerClueAccess({ number: 1, welcoming: true })).toEqual({
      editable: false,
      locked: false,
    });
  });
});
