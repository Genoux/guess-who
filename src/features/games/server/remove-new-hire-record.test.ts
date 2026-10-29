import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ findGameById: vi.fn() }));
vi.mock("./game-records", () => records);

import { removeNewHireRecord } from "./remove-new-hire-record";

const now = new Date("2026-10-28T15:00:00Z");
const upcoming = { id: "game_1", status: "active", startDate: "2026-11-02", playerPersonId: null };
const failsWith = (kind: "forbidden" | "not_found") =>
  expect.toSatisfy((err) => isAppError(err, kind));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["game_1"]] });
  records.findGameById.mockResolvedValue(upcoming);
});

describe("removeNewHireRecord", () => {
  it("deletes an active game that has not started, signed in or not", async () => {
    await removeNewHireRecord({ gameId: "game_1", now });
    const [statement] = sentStatements(client);
    expect(statement?.sql).toMatch(
      /^delete from games where \(games\.id = \$1 and games\.status = \$2\)/,
    );
    expect(statement?.params).toEqual(["game_1", "active"]);
  });

  it("removes a linked game without touching the person", async () => {
    records.findGameById.mockResolvedValue({ ...upcoming, playerPersonId: "sam" });
    await removeNewHireRecord({ gameId: "game_1", now });
    expect(sentStatements(client).map(({ sql }) => sql)).toEqual([
      expect.stringMatching(/^delete from games /),
    ]);
  });

  it("refuses a game that has started", async () => {
    records.findGameById.mockResolvedValue({ ...upcoming, startDate: "2026-10-28" });
    await expect(removeNewHireRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("answers not found for an unknown game", async () => {
    records.findGameById.mockResolvedValue(undefined);
    await expect(removeNewHireRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("not_found"),
    );
  });

  it("refuses when the game changed between the read and the delete", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(removeNewHireRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("forbidden"),
    );
  });
});
