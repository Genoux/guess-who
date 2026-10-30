import { describe, expect, it } from "vitest";
import {
  addNewHireSchema,
  changeInviteEmailSchema,
  endMissionSchema,
  setAsNewHireSchema,
  TURN_ON_MISSIONS_MAX,
  turnOnMissionsSchema,
} from "./schemas";

const ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const ID_2 = "7a1d2e3f-4c5b-4d6e-9fa0-1b2c3d4e5f60";

const messages = (schema: typeof addNewHireSchema, values: object) => {
  const parsed = schema.safeParse(values);
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("addNewHireSchema", () => {
  it("normalizes the email", () => {
    expect(addNewHireSchema.parse({ email: "  Sam.Taylor@Gmail.com " })).toEqual({
      email: "sam.taylor@gmail.com",
    });
  });

  it.each(["", "   ", "sam", "sam@"])("asks for an email, not %j", (email) => {
    expect(messages(addNewHireSchema, { email })).toEqual({ email: "Enter their email." });
  });
});

describe("changeInviteEmailSchema", () => {
  it("needs the game id", () => {
    const values = { email: "sam@gmail.com" };
    expect(changeInviteEmailSchema.safeParse({ ...values, gameId: ID }).success).toBe(true);
    expect(changeInviteEmailSchema.safeParse({ ...values, gameId: "x" }).success).toBe(false);
  });
});

describe.each([["endMissionSchema", endMissionSchema]])("%s", (_name, schema) => {
  it("needs the game id", () => {
    expect(schema.safeParse({ gameId: ID }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });
});

describe("turnOnMissionsSchema", () => {
  it("takes person ids, once each", () => {
    expect(turnOnMissionsSchema.parse({ personIds: [ID, ID_2, ID] })).toEqual({
      personIds: [ID, ID_2],
    });
  });

  it("refuses nobody, ids that are not uuids, and an absurd list", () => {
    expect(turnOnMissionsSchema.safeParse({ personIds: [] }).success).toBe(false);
    expect(turnOnMissionsSchema.safeParse({ personIds: ["ana"] }).success).toBe(false);
    const tooMany = Array.from(
      { length: TURN_ON_MISSIONS_MAX + 1 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect(turnOnMissionsSchema.safeParse({ personIds: tooMany }).success).toBe(false);
  });
});

describe("setAsNewHireSchema", () => {
  it("needs a person id", () => {
    expect(setAsNewHireSchema.safeParse({ personId: ID, startMission: true }).success).toBe(true);
    expect(setAsNewHireSchema.safeParse({ personId: "x", startMission: true }).success).toBe(false);
  });

  it("says whether to start the mission now", () => {
    expect(setAsNewHireSchema.safeParse({ personId: ID, startMission: false }).success).toBe(true);
    expect(setAsNewHireSchema.safeParse({ personId: ID }).success).toBe(false);
  });
});
