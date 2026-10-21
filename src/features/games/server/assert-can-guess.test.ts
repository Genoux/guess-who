import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import type { Game } from "../types";
import { assertCanGuess } from "./assert-can-guess";

const allowed = {
  game: { playerPersonId: "player", status: "active" as Game["status"] },
  viewerPersonId: "player",
  collected: true,
  alreadyGuessed: false,
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanGuess", () => {
  it("allows the player to guess a collected, unguessed sticker in an active game", () => {
    expect(() => assertCanGuess(allowed)).not.toThrow();
  });

  it("forbids anyone but the player", () => {
    expect(() => assertCanGuess({ ...allowed, viewerPersonId: "teammate" })).toThrow(
      failsWith("forbidden"),
    );
  });

  it.each(["found", "revealed"] as const)("refuses once the game is %s", (status) => {
    expect(() => assertCanGuess({ ...allowed, game: { ...allowed.game, status } })).toThrow(
      failsWith("conflict"),
    );
  });

  it("forbids guessing a sticker that is not collected", () => {
    expect(() => assertCanGuess({ ...allowed, collected: false })).toThrow(failsWith("forbidden"));
  });

  it("refuses a person who was already guessed", () => {
    expect(() => assertCanGuess({ ...allowed, alreadyGuessed: true })).toThrow(
      failsWith("conflict"),
    );
  });
});
