import { describe, expect, it } from "vitest";
import { updateMyCardSchema } from "./schemas";

const TEAM_ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const valid = { teamId: TEAM_ID, location: "Montréal", fact: "Bakes bread", ask: "Sourdough" };

const messages = (values: Record<string, unknown>) => {
  const parsed = updateMyCardSchema.safeParse(values);
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("updateMyCardSchema", () => {
  it("trims every text field", () => {
    expect(
      updateMyCardSchema.parse({ ...valid, location: "  Lisbon ", fact: " A ", ask: " B " }),
    ).toEqual({ teamId: TEAM_ID, location: "Lisbon", fact: "A", ask: "B" });
  });

  it("accepts a draft with no team and blank fields", () => {
    expect(updateMyCardSchema.parse({ teamId: null, location: "  ", fact: "", ask: "" })).toEqual({
      teamId: null,
      location: "",
      fact: "",
      ask: "",
    });
  });

  it("still rejects a team that is not an id", () => {
    expect(messages({ ...valid, teamId: "" })).toEqual({ teamId: "Pick your team." });
  });

  it("caps location at 25, fact at 120 and ask at 55 characters after trimming", () => {
    expect(
      messages({ ...valid, location: "x".repeat(25), fact: "x".repeat(120), ask: "x".repeat(55) }),
    ).toEqual({});
    expect(
      messages({ ...valid, location: "x".repeat(26), fact: "x".repeat(121), ask: "x".repeat(56) }),
    ).toEqual({
      location: "Keep it to 25 characters.",
      fact: "Keep it to 120 characters.",
      ask: "Keep it to 55 characters.",
    });
    expect(messages({ ...valid, location: ` ${"x".repeat(25)} ` })).toEqual({});
  });
});
