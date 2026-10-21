import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import type { Game } from "../types";
import { assertCanWriteClue } from "./assert-can-write-clue";

const releaseAt = new Date("2026-11-06T13:00:00Z");
const allowed = {
  game: { id: "game_1", welcomerPersonId: "welcomer", status: "active" as Game["status"] },
  clue: { gameId: "game_1", number: 2, releaseAt },
  viewerPersonId: "welcomer",
  now: new Date("2026-11-06T12:59:59Z"),
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanWriteClue", () => {
  it.each([2, 3, 4])("allows the welcomer to write clue %i before release", (number) => {
    expect(() =>
      assertCanWriteClue({ ...allowed, clue: { ...allowed.clue, number } }),
    ).not.toThrow();
  });

  it.each(["player", "admin_person", "teammate"])("forbids %s", (viewerPersonId) => {
    expect(() => assertCanWriteClue({ ...allowed, viewerPersonId })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("forbids a clue from another game", () => {
    expect(() =>
      assertCanWriteClue({ ...allowed, clue: { ...allowed.clue, gameId: "game_2" } }),
    ).toThrow(failsWith("forbidden"));
  });

  it.each(["found", "revealed"] as const)("refuses once the game is %s", (status) => {
    expect(() => assertCanWriteClue({ ...allowed, game: { ...allowed.game, status } })).toThrow(
      failsWith("conflict"),
    );
  });

  it("forbids the generated team clue", () => {
    expect(() => assertCanWriteClue({ ...allowed, clue: { ...allowed.clue, number: 1 } })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("refuses at the release time", () => {
    expect(() => assertCanWriteClue({ ...allowed, now: releaseAt })).toThrow(failsWith("conflict"));
  });

  it("refuses after release", () => {
    expect(() => assertCanWriteClue({ ...allowed, now: new Date("2026-11-07T00:00:00Z") })).toThrow(
      failsWith("conflict"),
    );
  });
});
