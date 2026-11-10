import { describe, expect, it } from "vitest";
import { updateMyCardSchema } from "./schemas";

const TEAM_ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const valid = { teamId: TEAM_ID, fact: "Bakes bread", ask: "Sourdough" };

const messages = (values: Record<string, unknown>) => {
  const parsed = updateMyCardSchema.safeParse(values);
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("updateMyCardSchema", () => {
  it("trims fact and ask", () => {
    expect(updateMyCardSchema.parse({ ...valid, fact: " A ", ask: " B " })).toMatchObject({
      fact: "A",
      ask: "B",
    });
  });

  it("accepts a draft with no team and blank fields", () => {
    expect(updateMyCardSchema.parse({ teamId: null, fact: "", ask: "  " })).toEqual({
      teamId: null,
      fact: "",
      ask: "",
    });
  });

  it("asks for a team from the list when the id is not one", () => {
    expect(messages({ ...valid, teamId: "creative" })).toEqual({ teamId: "Pick your team." });
  });

  it("drops location and name, which come from Deel", () => {
    expect(updateMyCardSchema.parse({ ...valid, location: "Lisbon", name: "Eve" })).toEqual(valid);
  });

  it("caps fact at 120 and ask at 55 characters after trimming", () => {
    expect(messages({ ...valid, fact: "x".repeat(120), ask: "x".repeat(55) })).toEqual({});
    expect(messages({ ...valid, fact: "x".repeat(121), ask: "x".repeat(56) })).toEqual({
      fact: "Keep it to 120 characters.",
      ask: "Keep it to 55 characters.",
    });
    expect(messages({ ...valid, fact: ` ${"x".repeat(120)} ` })).toEqual({});
  });
});
