import { describe, expect, it } from "vitest";
import { TEAM_DEFINITIONS, teamForDeelDepartment } from "./teams";

describe("teamForDeelDepartment", () => {
  it.each([
    ["Design (IB)", "Creative"],
    ["Production (CA)", "Creative"],
    ["Creative Strategy (CM)", "Strategy"],
    ["Retention (CA)", "Client Services"],
    ["Talent (CM)", "Talent"],
    ["Search LT (IB)", "Paid & Search"],
    ["Go To Market (AAG)", "Sales"],
    ["Content Allies", "Ops"],
    ["FP&A (IB)", "Ops"],
    ["Freelancers Pod (IB)", "Freelancers"],
  ])("puts %s in %s", (department, team) => {
    expect(teamForDeelDepartment(department)).toBe(team);
  });

  it("matches exactly: the entity suffix and the case count", () => {
    expect(teamForDeelDepartment("Design")).toBeNull();
    expect(teamForDeelDepartment("design (IB)")).toBeNull();
    expect(teamForDeelDepartment("Design (CM)")).toBeNull();
  });

  it("returns null for an unknown department", () => {
    expect(teamForDeelDepartment("Underwater Basket Weaving (IB)")).toBeNull();
    expect(teamForDeelDepartment("")).toBeNull();
  });

  it("places every department in exactly one team", () => {
    const departments = TEAM_DEFINITIONS.flatMap(({ deelDepartments }) => deelDepartments);
    expect(departments).toHaveLength(46);
    expect(new Set(departments).size).toBe(departments.length);
    for (const { name, deelDepartments } of TEAM_DEFINITIONS) {
      for (const department of deelDepartments)
        expect(teamForDeelDepartment(department)).toBe(name);
    }
  });

  it("has eight teams with distinct names and colors", () => {
    expect(TEAM_DEFINITIONS).toHaveLength(8);
    expect(new Set(TEAM_DEFINITIONS.map(({ name }) => name)).size).toBe(8);
    expect(new Set(TEAM_DEFINITIONS.map(({ color }) => color)).size).toBe(8);
  });
});
