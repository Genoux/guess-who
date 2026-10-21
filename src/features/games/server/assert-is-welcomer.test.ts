import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertIsWelcomer } from "./assert-is-welcomer";

const game = { playerPersonId: "player", welcomerPersonId: "welcomer" };
const forbidden = expect.toSatisfy((err) => isAppError(err, "forbidden"));

describe("assertIsWelcomer", () => {
  it("allows the game's welcomer", () => {
    expect(() => assertIsWelcomer(game, "welcomer")).not.toThrow();
  });

  it.each(["player", "admin_person", "teammate"])("forbids %s", (viewer) => {
    expect(() => assertIsWelcomer(game, viewer)).toThrow(forbidden);
  });

  it("forbids a player who is somehow also the welcomer", () => {
    expect(() =>
      assertIsWelcomer({ playerPersonId: "same", welcomerPersonId: "same" }, "same"),
    ).toThrow(forbidden);
  });
});
