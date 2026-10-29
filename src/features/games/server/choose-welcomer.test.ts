import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { chooseWelcomer, eligibleWelcomers } from "./choose-welcomer";

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
    playerEmail: "sam@gmail.com",
    random: () => 0,
    ...overrides,
  });

describe("chooseWelcomer", () => {
  it("picks uniformly among the free teammates", () => {
    expect(choose({ random: () => 0 }).id).toBe("ana");
    expect(choose({ random: () => 0.5 }).id).toBe("ben");
    expect(choose({ random: () => 0.999 }).id).toBe("cleo");
  });

  it("skips teammates already welcoming a new hire", () => {
    expect(choose({ busyWelcomerIds: ["ana"] }).id).toBe("ben");
  });

  it("skips the new hire, matched by email", () => {
    expect(choose({ playerEmail: "ana@inbeat.agency" }).id).toBe("ben");
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

  it("says so when nobody is free", () => {
    expect(() => choose({ busyWelcomerIds: ["ana", "ben", "cleo"] })).toThrow(
      expect.toSatisfy((err) => isAppError(err, "not_found")),
    );
    expect(() => choose({ people: [] })).toThrow(
      expect.objectContaining({ safeMessage: "No teammate is free to welcome them yet." }),
    );
  });
});

describe("eligibleWelcomers", () => {
  const people = [person("ana"), person("ben", { hidden: true }), person("cleo"), person("dev")];

  it("lists everyone who could welcome the new hire, in order", () => {
    expect(
      eligibleWelcomers({ people, busyWelcomerIds: ["cleo"], playerEmail: "sam@gmail.com" }).map(
        ({ id }) => id,
      ),
    ).toEqual(["ana", "dev"]);
  });

  it("leaves the new hire out", () => {
    expect(
      eligibleWelcomers({ people, busyWelcomerIds: [], playerEmail: "dev@inbeat.agency" }).map(
        ({ id }) => id,
      ),
    ).toEqual(["ana", "cleo"]);
  });
});
