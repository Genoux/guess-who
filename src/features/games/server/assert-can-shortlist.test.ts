import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import type { Game } from "../types";
import { assertCanShortlist } from "./assert-can-shortlist";

const allowed = {
  game: { playerPersonId: "player", status: "active" as Game["status"] },
  viewerPersonId: "player",
  collected: true,
  ruled: false,
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanShortlist", () => {
  it("lets the player mark a collected sticker", () => {
    expect(() => assertCanShortlist(allowed)).not.toThrow();
  });

  it("forbids anyone but the player", () => {
    expect(() => assertCanShortlist({ ...allowed, viewerPersonId: "teammate" })).toThrow(
      failsWith("forbidden"),
    );
  });

  it.each(["found", "revealed"] as const)("refuses once the game is %s", (status) => {
    expect(() => assertCanShortlist({ ...allowed, game: { ...allowed.game, status } })).toThrow(
      failsWith("conflict"),
    );
  });

  it("forbids a sticker that is not collected", () => {
    expect(() => assertCanShortlist({ ...allowed, collected: false })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("refuses a person who was ruled out", () => {
    expect(() => assertCanShortlist({ ...allowed, ruled: true })).toThrow(failsWith("conflict"));
  });
});
