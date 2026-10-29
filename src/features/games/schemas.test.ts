import { describe, expect, it } from "vitest";
import { createNewHireSchema, removeNewHireSchema, updateNewHireSchema } from "./schemas";

const GAME_ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";

const messages = (
  schema: typeof createNewHireSchema | typeof updateNewHireSchema,
  values: object,
) => {
  const parsed = schema.safeParse(values);
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("createNewHireSchema", () => {
  it("normalizes the email", () => {
    expect(
      createNewHireSchema.parse({ email: "  Sam.Taylor@Gmail.com ", startDate: "2026-11-02" }),
    ).toEqual({ email: "sam.taylor@gmail.com", startDate: "2026-11-02" });
  });

  it.each(["", "   ", "sam", "sam@"])("asks for an email, not %j", (email) => {
    expect(messages(createNewHireSchema, { email, startDate: "2026-11-02" })).toEqual({
      email: "Enter their email.",
    });
  });

  it.each(["", "2026-13-01", "11/02/2026"])("asks for a real first day, not %j", (startDate) => {
    expect(messages(createNewHireSchema, { email: "sam@gmail.com", startDate })).toEqual({
      startDate: "Pick the first day.",
    });
  });
});

describe("updateNewHireSchema", () => {
  it("needs the game id", () => {
    const values = { email: "sam@gmail.com", startDate: "2026-11-02" };
    expect(updateNewHireSchema.safeParse({ ...values, gameId: GAME_ID }).success).toBe(true);
    expect(updateNewHireSchema.safeParse({ ...values, gameId: "x" }).success).toBe(false);
  });
});

describe("updateNewHireSchema welcomer", () => {
  const values = { gameId: GAME_ID, email: "sam@gmail.com", startDate: "2026-11-02" };

  it("takes an optional welcomer id", () => {
    expect(updateNewHireSchema.safeParse(values).success).toBe(true);
    expect(updateNewHireSchema.safeParse({ ...values, welcomerPersonId: GAME_ID }).success).toBe(
      true,
    );
    expect(updateNewHireSchema.safeParse({ ...values, welcomerPersonId: "ana" }).success).toBe(
      false,
    );
  });
});

describe("removeNewHireSchema", () => {
  it("needs the game id", () => {
    expect(removeNewHireSchema.safeParse({ gameId: GAME_ID }).success).toBe(true);
    expect(removeNewHireSchema.safeParse({}).success).toBe(false);
  });
});
