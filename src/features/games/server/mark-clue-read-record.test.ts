import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { markClueReadRecord } from "./mark-clue-read-record";

const game = { id: "game_1", playerPersonId: "player", startDate: "2026-11-02" };
// Clue 2 lands on day 6, 2026-11-07 at 09:00 Montréal (14:00 UTC).
const afterClue2 = new Date("2026-11-07T14:00:00Z");

beforeEach(() => {
  client.query.mockClear();
});

describe("markClueReadRecord", () => {
  it("keeps the highest clue the player opened", async () => {
    await markClueReadRecord({ game, viewerPersonId: "player", number: 2, now: afterClue2 });
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /update games set last_read_clue = greatest\(games\.last_read_clue, \$1\), updated_at = \$2 where games\.id = \$3/,
    );
    expect(update?.params).toEqual([2, expect.any(String), "game_1"]);
  });

  it("refuses a clue that has not landed", async () => {
    await expect(
      markClueReadRecord({ game, viewerPersonId: "player", number: 3, now: afterClue2 }),
    ).rejects.toSatisfy((err) => isAppError(err, "conflict"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("forbids anyone but the player", async () => {
    await expect(
      markClueReadRecord({ game, viewerPersonId: "welcomer", number: 2, now: afterClue2 }),
    ).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});
