import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { markIntroSeenRecord } from "./mark-intro-seen-record";

const game = { id: "game_1", playerPersonId: "player", status: "active" as const };
const now = new Date("2026-11-02T15:00:00Z");

beforeEach(() => {
  client.query.mockClear();
});

describe("markIntroSeenRecord", () => {
  it("keeps the first time the player left the tour", async () => {
    await markIntroSeenRecord({ game, viewerPersonId: "player", now });
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /update games set intro_seen_at = coalesce\(games\.intro_seen_at, \$1\), updated_at = \$2 where games\.id = \$3/,
    );
    expect(update?.params?.[2]).toBe("game_1");
  });

  it("forbids anyone but the player", async () => {
    await expect(markIntroSeenRecord({ game, viewerPersonId: "teammate", now })).rejects.toSatisfy(
      (err) => isAppError(err, "forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });
});
