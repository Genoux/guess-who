import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Drizzle runs against a fake client, so the tests read the SQL each step sends.
const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }, _params: unknown[]) => ({
    rows: [] as unknown[][],
  })),
}));

vi.mock("@/shared/lib/db", async () => {
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const schema = await import("@/db/schema");
  return { db: drizzle({ client: client as never, schema }) };
});

import { updateCardRecord } from "./update-card-record";

const TEAM_ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const input = { teamId: TEAM_ID, location: "Montréal", fact: "Bakes bread", ask: "Sourdough" };

const sql = (call: number) => client.query.mock.calls[call]?.[0].text.replaceAll('"', "") ?? "";
const params = (call: number) => client.query.mock.calls[call]?.[1];

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("updateCardRecord", () => {
  it("saves the fields on the given person only", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [[TEAM_ID]] })
      .mockResolvedValueOnce({ rows: [[TEAM_ID, "Montréal", "Bakes bread", "Sourdough"]] });

    await expect(updateCardRecord(input, "person_1")).resolves.toEqual({
      teamId: TEAM_ID,
      location: "Montréal",
      fact: "Bakes bread",
      ask: "Sourdough",
    });
    expect(sql(0)).toMatch(/from teams where teams\.id = \$1 limit \$2/);
    expect(params(0)).toEqual([TEAM_ID, 1]);
    expect(sql(1)).toMatch(
      /update people set team_id = \$1, location = \$2, fact = \$3, ask = \$4, updated_at = \$5 where people\.id = \$6 returning/,
    );
    expect(params(1)).toEqual([
      TEAM_ID,
      "Montréal",
      "Bakes bread",
      "Sourdough",
      expect.any(String),
      "person_1",
    ]);
  });

  it("rejects a team that does not exist without writing", async () => {
    await expect(updateCardRecord(input, "person_1")).rejects.toSatisfy(
      (err) => isAppError(err, "validation") && err.safeMessage === "Pick your team.",
    );
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("fails when the person row is gone", async () => {
    client.query.mockResolvedValueOnce({ rows: [[TEAM_ID]] });
    await expect(updateCardRecord(input, "person_1")).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
  });
});
