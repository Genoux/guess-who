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

const welcoming = vi.hoisted(() => ({ findActiveWelcomerGame: vi.fn() }));
vi.mock("@/shared/lib/find-active-welcomer-game", () => welcoming);

import { updateCardRecord } from "./update-card-record";

const now = new Date("2026-11-05T15:00:00Z");

const TEAM_ID = "6f0c1d2e-3b4a-4c5d-8e9f-0a1b2c3d4e5f";
const input = { fact: "Bakes bread", ask: "Sourdough" };
const deelRow = [TEAM_ID, "Canada"];

const sql = (call: number) => client.query.mock.calls[call]?.[0].text.replaceAll('"', "") ?? "";
const params = (call: number) => client.query.mock.calls[call]?.[1];

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  welcoming.findActiveWelcomerGame.mockReset();
  welcoming.findActiveWelcomerGame.mockResolvedValue(null);
});

describe("updateCardRecord", () => {
  it("writes fact and ask on the given person only, never team or location", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [deelRow] })
      .mockResolvedValueOnce({ rows: [[TEAM_ID, "Canada", "Bakes bread", "Sourdough"]] });

    await expect(updateCardRecord(input, "person_1", now)).resolves.toEqual({
      teamId: TEAM_ID,
      location: "Canada",
      fact: "Bakes bread",
      ask: "Sourdough",
    });
    expect(sql(1)).toMatch(
      /update people set fact = \$1, ask = \$2, updated_at = \$3 where people\.id = \$4 returning/,
    );
    expect(params(1)).toEqual(["Bakes bread", "Sourdough", expect.any(String), "person_1"]);
  });

  it("fails when the person row is gone", async () => {
    await expect(updateCardRecord(input, "person_1", now)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("saves blank fields as nulls", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [deelRow] })
      .mockResolvedValueOnce({ rows: [[TEAM_ID, "Canada", null, null]] });

    await expect(updateCardRecord({ fact: "", ask: "" }, "person_1", now)).resolves.toEqual({
      teamId: TEAM_ID,
      location: "Canada",
      fact: "",
      ask: "",
    });
    expect(params(1)?.slice(0, 2)).toEqual([null, null]);
  });

  it("refuses an incomplete card while they welcome a started mission, without writing", async () => {
    welcoming.findActiveWelcomerGame.mockResolvedValue({ id: "game_1" });
    client.query.mockResolvedValueOnce({ rows: [deelRow] });
    await expect(updateCardRecord({ ...input, ask: "" }, "person_1", now)).rejects.toSatisfy(
      (err) =>
        isAppError(err, "forbidden") && err.safeMessage === "Locked while the new hire is playing.",
    );
    expect(welcoming.findActiveWelcomerGame).toHaveBeenCalledWith("person_1", now);
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("refuses while welcoming when Deel left the team empty, since the card cannot be complete", async () => {
    welcoming.findActiveWelcomerGame.mockResolvedValue({ id: "game_1" });
    client.query.mockResolvedValueOnce({ rows: [[null, "Canada"]] });
    await expect(updateCardRecord(input, "person_1", now)).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("still lets them edit a complete card while they welcome a started mission", async () => {
    welcoming.findActiveWelcomerGame.mockResolvedValue({ id: "game_1" });
    client.query
      .mockResolvedValueOnce({ rows: [deelRow] })
      .mockResolvedValueOnce({ rows: [[TEAM_ID, "Canada", "Bakes bread", "Sourdough"]] });
    await expect(updateCardRecord(input, "person_1", now)).resolves.toMatchObject({
      ask: "Sourdough",
    });
  });
});
