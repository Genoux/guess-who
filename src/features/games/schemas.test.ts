import { describe, expect, it } from "vitest";
import {
  endMissionSchema,
  startAsNewHireSchema,
  TURN_ON_MISSIONS_MAX,
  turnOnMissionsSchema,
  writeClueSchema,
} from "./schemas";

const ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const ID_2 = "7a1d2e3f-4c5b-4d6e-9fa0-1b2c3d4e5f60";

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

describe("startAsNewHireSchema", () => {
  it("needs a person id", () => {
    expect(startAsNewHireSchema.safeParse({ personId: ID }).success).toBe(true);
    expect(startAsNewHireSchema.safeParse({ personId: "x" }).success).toBe(false);
  });
});

describe("writeClueSchema", () => {
  it("trims the text and lets it be blank, which clears the clue", () => {
    expect(writeClueSchema.parse({ number: 2, text: "  Never owned a car. " }).text).toBe(
      "Never owned a car.",
    );
    expect(writeClueSchema.parse({ number: 3, text: "   " }).text).toBe("");
  });

  it("caps the text and only takes clues 2 to 4", () => {
    expect(writeClueSchema.safeParse({ number: 2, text: "x".repeat(161) }).success).toBe(false);
    expect(writeClueSchema.safeParse({ number: 1, text: "x" }).success).toBe(false);
  });
});
