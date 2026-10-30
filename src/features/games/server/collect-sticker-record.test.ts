import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({
  findPersonById: vi.fn(),
  hasCollected: vi.fn(),
  findLatestPlayerGame: vi.fn(),
}));
vi.mock("./game-records", () => records);

import { collectStickerRecord } from "./collect-sticker-record";

const teammate = { id: "teammate", hidden: false, teamId: "team_1", ask: "Night trains" };
const input = { viewerPersonId: "viewer", personId: "teammate", note: "Loves trains" };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["collection_1"]] });
  records.findPersonById.mockResolvedValue(teammate);
  records.hasCollected.mockResolvedValue(false);
  records.findLatestPlayerGame.mockResolvedValue(undefined);
});

describe("collectStickerRecord", () => {
  it("stores the collection with the private note", async () => {
    await collectStickerRecord(input);
    const [insert] = sentStatements(client);
    expect(insert?.sql).toMatch(
      /insert into collections .* on conflict \(collector_person_id,person_id\) do nothing returning/,
    );
    expect(insert?.params).toEqual(expect.arrayContaining(["viewer", "teammate", "Loves trains"]));
  });

  it("lets a player collect the welcomer of their running mission, whatever their card says", async () => {
    records.findPersonById.mockResolvedValue({ ...teammate, hidden: true, teamId: null });
    records.findLatestPlayerGame.mockResolvedValue({
      status: "active",
      welcomerPersonId: "teammate",
      startDate: "2026-10-28",
    });
    await expect(collectStickerRecord(input)).resolves.toBeUndefined();
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
