import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({
  findPersonById: vi.fn(),
  hasCollected: vi.fn(),
}));
vi.mock("./game-records", () => records);

import { collectStickerRecord } from "./collect-sticker-record";

const game = { id: "game_1", playerPersonId: "player", status: "active" as const };
const teammate = { id: "teammate", hidden: false, teamId: "team_1", ask: "Night trains" };
const input = { game, viewerPersonId: "player", personId: "teammate", note: "Loves trains" };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["collection_1"]] });
  records.findPersonById.mockResolvedValue(teammate);
  records.hasCollected.mockResolvedValue(false);
});

describe("collectStickerRecord", () => {
  it("stores the collection with the private note", async () => {
    await collectStickerRecord(input);
    const [insert] = sentStatements(client);
    expect(insert?.sql).toMatch(
      /insert into collections .* on conflict \(game_id,person_id\) do nothing returning/,
    );
    expect(insert?.params).toEqual(expect.arrayContaining(["game_1", "teammate", "Loves trains"]));
  });

  it("checks the policy before writing", async () => {
    records.hasCollected.mockResolvedValue(true);
    await expect(collectStickerRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses someone outside the album", async () => {
    records.findPersonById.mockResolvedValue(undefined);
    await expect(collectStickerRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
  });

  it("reports a lost race as already collected", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(collectStickerRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
  });
});
