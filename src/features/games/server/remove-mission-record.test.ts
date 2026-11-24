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

import { type MissionStage, removeMissionRecord } from "./remove-mission-record";

const now = new Date("2026-10-28T15:00:00Z");
const game = (status: string) => ({
  id: "game_1",
  status,
  welcomerPersonId: "ana",
  startDate: "2026-10-26",
});
const remove = (stage: MissionStage) => removeMissionRecord({ gameId: "game_1", stage, now });
const failsWith = (kind: "forbidden" | "not_found") =>
  expect.toSatisfy((err) => isAppError(err, kind));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["game_1"]] });
  records.findGameById.mockResolvedValue(game("active"));
});

describe("removeMissionRecord", () => {
  it("ends a running mission with a delete guarded on its status, and nothing else", async () => {
    await remove("playing");
    const [statement, ...rest] = sentStatements(client);
    expect(statement?.sql).toMatch(
      /^delete from games where \(games\.id = \$1 and games\.status in \(\$2\)\)/,
    );
    expect(statement?.params).toEqual(["game_1", "active"]);
    expect(rest).toEqual([]);
  });

  it.each(["found", "revealed"])("resets a %s mission", async (status) => {
    records.findGameById.mockResolvedValue(game(status));
    await remove("done");
    const [statement] = sentStatements(client);
    expect(statement?.sql).toMatch(/games\.status in \(\$2, \$3\)/);
    expect(statement?.params).toEqual(["game_1", "found", "revealed"]);
  });

  it.each([
    ["playing", "found"],
    ["playing", "revealed"],
    ["done", "active"],
  ] as const)("refuses %s on a mission that is %s", async (stage, status) => {
    records.findGameById.mockResolvedValue(game(status));
    await expect(remove(stage)).rejects.toThrow(failsWith("forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("answers not found for an unknown game", async () => {
    records.findGameById.mockResolvedValue(undefined);
    await expect(remove("playing")).rejects.toThrow(failsWith("not_found"));
  });

  it("refuses when the mission changed between the read and the delete", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(remove("playing")).rejects.toThrow(failsWith("forbidden"));
  });
});
