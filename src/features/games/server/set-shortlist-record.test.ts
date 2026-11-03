import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ hasCollected: vi.fn(), hasGuessed: vi.fn() }));
vi.mock("./game-records", () => records);

import { setShortlistRecord } from "./set-shortlist-record";

const game = { id: "game_1", playerPersonId: "player", status: "active" as const };
const input = { game, viewerPersonId: "player", personId: "teammate" };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  records.hasCollected.mockResolvedValue(true);
  records.hasGuessed.mockResolvedValue(false);
});

describe("setShortlistRecord", () => {
  it("adds the person to the maybe list once", async () => {
    await setShortlistRecord({ ...input, on: true });
    const [insert] = sentStatements(client);
    expect(insert?.sql).toMatch(
      /insert into shortlists .* on conflict \(game_id,person_id\) do nothing/,
    );
    expect(insert?.params).toEqual(expect.arrayContaining(["game_1", "teammate"]));
  });

  it("removes the person from the maybe list", async () => {
    await setShortlistRecord({ ...input, on: false });
    const [remove] = sentStatements(client);
    expect(remove?.sql).toMatch(
      /delete from shortlists where \(shortlists\.game_id = \$1 and shortlists\.person_id = \$2\)/,
    );
    expect(remove?.params).toEqual(["game_1", "teammate"]);
  });

  it("refuses an uncollected sticker without writing", async () => {
    records.hasCollected.mockResolvedValue(false);
    await expect(setShortlistRecord({ ...input, on: true })).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses a ruled out person", async () => {
    records.hasGuessed.mockResolvedValue(true);
    await expect(setShortlistRecord({ ...input, on: true })).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
  });
});
