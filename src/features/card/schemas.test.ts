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

  it("requires a team and every field, blank counting as empty", () => {
    expect(messages({ teamId: "", location: "   ", fact: "", ask: "" })).toEqual({
      teamId: "Pick your team.",
      location: "Add where you're based.",
      fact: "Add a random fact.",
      ask: "Add something to ask you about.",
    });
  });

  it("caps location at 60, fact at 140 and ask at 80 characters after trimming", () => {
    expect(
      messages({ ...valid, location: "x".repeat(60), fact: "x".repeat(140), ask: "x".repeat(80) }),
    ).toEqual({});
    expect(
      messages({ ...valid, location: "x".repeat(61), fact: "x".repeat(141), ask: "x".repeat(81) }),
    ).toEqual({
      location: "Keep it to 60 characters.",
      fact: "Keep it to 140 characters.",
      ask: "Keep it to 80 characters.",
    });
    expect(messages({ ...valid, location: ` ${"x".repeat(60)} ` })).toEqual({});
  });
});
