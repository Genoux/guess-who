import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { chooseWelcomer, eligibleWelcomers, NO_WELCOMER_FREE } from "./choose-welcomer";

const person = (id: string, overrides = {}) => ({
  id,
  email: `${id}@inbeat.agency`,
  hidden: false,
  teamId: "team_1",
  ask: "Night trains",
  writtenClues: [2, 3, 4],
  ...overrides,
});

const choose = (overrides: Partial<Parameters<typeof chooseWelcomer>[0]> = {}) =>
  chooseWelcomer({
    people: [person("ana"), person("ben"), person("cleo")],
    busyWelcomerIds: [],
    playerPersonId: "sam",
    welcomedPersonId: null,
    random: () => 0,
    ...overrides,
  });

describe("chooseWelcomer", () => {
  it("picks uniformly among the free teammates", () => {
    expect(choose({ random: () => 0 }).id).toBe("ana");
    expect(choose({ random: () => 0.5 }).id).toBe("ben");
    expect(choose({ random: () => 0.999 }).id).toBe("cleo");
  });

  it("skips teammates already welcoming a mission", () => {
    expect(choose({ busyWelcomerIds: ["ana"] }).id).toBe("ben");
  });

  it("skips the player", () => {
    expect(choose({ playerPersonId: "ana" }).id).toBe("ben");
  });

  it("skips the person the player is welcoming, so two people never welcome each other", () => {
    expect(choose({ welcomedPersonId: "ana" }).id).toBe("ben");
  });

  it.each([
    ["hidden", { hidden: true }],
    ["without a team", { teamId: null }],
    ["without an ask", { ask: " " }],
  ])("skips a card that is %s", (_name, overrides) => {
    expect(choose({ people: [person("ana", overrides), person("ben")] }).id).toBe("ben");
  });

  it.each([
    ["no clues", []],
    ["two clues", [2, 3]],
    ["clues 3 and 4 only", [3, 4]],
  ])("skips a teammate with %s written", (_name, writtenClues) => {
    expect(choose({ people: [person("ana", { writtenClues }), person("ben")] }).id).toBe("ben");
  });

  it("answers a conflict when nobody is free", () => {
    const noOne = expect.toSatisfy((err) => isAppError(err, "conflict"));
    expect(() => choose({ busyWelcomerIds: ["ana", "ben", "cleo"] })).toThrow(noOne);
    expect(() => choose({ people: [] })).toThrow(
      expect.objectContaining({ safeMessage: NO_WELCOMER_FREE }),
    );
  });
});

describe("eligibleWelcomers", () => {
  const people = [person("ana"), person("ben", { hidden: true }), person("cleo"), person("dev")];
  const base = { people, busyWelcomerIds: [], playerPersonId: "sam", welcomedPersonId: null };

  it("lists everyone who could welcome the player, in order", () => {
    expect(eligibleWelcomers({ ...base, busyWelcomerIds: ["cleo"] }).map(({ id }) => id)).toEqual([
      "ana",
      "dev",
    ]);
  });

  it("leaves the player and the person they welcome out", () => {
    expect(
      eligibleWelcomers({ ...base, playerPersonId: "dev", welcomedPersonId: "ana" }).map(
        ({ id }) => id,
      ),
    ).toEqual(["cleo"]);
  });
});
