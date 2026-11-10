import { describe, expect, it } from "vitest";
import { TEAM_DEFINITIONS } from "./teams";

describe("TEAM_DEFINITIONS", () => {
  it("offers nine teams with distinct names and colors", () => {
    expect(TEAM_DEFINITIONS.map(({ name }) => name)).toEqual([
      "Creative",
      "UGC",
      "Strategy",
      "Client Services",
      "Talent",
      "Paid & Search",
      "Sales",
      "Ops",
      "People",
    ]);
    expect(new Set(TEAM_DEFINITIONS.map(({ color }) => color)).size).toBe(9);
  });
});
