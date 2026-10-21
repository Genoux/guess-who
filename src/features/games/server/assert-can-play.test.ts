import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanPlay } from "./assert-can-play";

describe("assertCanPlay", () => {
  it("allows the game's player", () => {
    expect(() => assertCanPlay({ playerPersonId: "player" }, "player")).not.toThrow();
  });

  it("forbids anyone else", () => {
    expect(() => assertCanPlay({ playerPersonId: "player" }, "welcomer")).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
  });

  it("forbids everyone while no player has signed in", () => {
    expect(() => assertCanPlay({ playerPersonId: null }, "someone")).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
  });
});
