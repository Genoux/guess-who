import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ findGameById: vi.fn() }));
vi.mock("./game-records", () => records);
vi.mock("@/shared/lib/finalize-expired-game-record", () => ({
  finalizeExpiredGameRecord: async (game: unknown) => game,
}));

import { endMissionRecord } from "./end-mission-record";

const now = new Date("2026-10-28T15:00:00Z");
const playing = {
  id: "game_1",
  status: "active",
  welcomerPersonId: "ana",
  startDate: "2026-10-26",
};
const failsWith = (kind: "forbidden" | "not_found") =>
  expect.toSatisfy((err) => isAppError(err, kind));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["game_1"]] });
  records.findGameById.mockResolvedValue(playing);
});

describe("endMissionRecord", () => {
  it("deletes a running mission with a guarded delete, and nothing else", async () => {
    await endMissionRecord({ gameId: "game_1", now });
    const [statement, ...rest] = sentStatements(client);
    expect(statement?.sql).toMatch(
      /^delete from games where \(games\.id = \$1 and games\.status = \$2\)/,
    );
    expect(statement?.params).toEqual(["game_1", "active"]);
    expect(rest).toEqual([]);
  });

  it.each(["found", "revealed"])("refuses a mission that is %s", async (status) => {
    records.findGameById.mockResolvedValue({ ...playing, status });
    await expect(endMissionRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("answers not found for an unknown game", async () => {
    records.findGameById.mockResolvedValue(undefined);
    await expect(endMissionRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("not_found"),
    );
  });

  it("refuses when the mission ended between the read and the delete", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(endMissionRecord({ gameId: "game_1", now })).rejects.toThrow(
      failsWith("forbidden"),
    );
  });
});
