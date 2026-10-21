import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import type { Game } from "../types";
import { assertCanCollect } from "./assert-can-collect";

const allowed = {
  game: { playerPersonId: "player", status: "active" as Game["status"] },
  viewerPersonId: "player",
  person: { id: "teammate", hidden: false, teamId: "team_1", ask: "Night trains" },
  alreadyCollected: false,
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanCollect", () => {
  it("lets the player collect a teammate in an active game", () => {
    expect(() => assertCanCollect(allowed)).not.toThrow();
  });

  it("forbids anyone but the player", () => {
    expect(() => assertCanCollect({ ...allowed, viewerPersonId: "welcomer" })).toThrow(
      failsWith("forbidden"),
    );
  });

  it.each(["found", "revealed"] as const)("refuses once the game is %s", (status) => {
    expect(() => assertCanCollect({ ...allowed, game: { ...allowed.game, status } })).toThrow(
      failsWith("conflict"),
    );
  });

  it("refuses an unknown person", () => {
    expect(() => assertCanCollect({ ...allowed, person: undefined })).toThrow(
      failsWith("not_found"),
    );
  });

  it("refuses the player's own sticker and hidden people", () => {
    expect(() =>
      assertCanCollect({ ...allowed, person: { ...allowed.person, id: "player" } }),
    ).toThrow(failsWith("not_found"));
    expect(() =>
      assertCanCollect({ ...allowed, person: { ...allowed.person, hidden: true } }),
    ).toThrow(failsWith("not_found"));
  });

  it("refuses a sticker that is already collected", () => {
    expect(() => assertCanCollect({ ...allowed, alreadyCollected: true })).toThrow(
      failsWith("conflict"),
    );
  });
});
