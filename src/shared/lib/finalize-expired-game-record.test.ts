import { beforeEach, describe, expect, it, vi } from "vitest";
import type { games } from "@/db/schema";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { finalizeExpiredGameRecord } from "./finalize-expired-game-record";

type Game = typeof games.$inferSelect;

const game: Game = {
  id: "game_1",
  playerPersonId: "player",
  playerEmail: "new@inbeat.agency",
  welcomerPersonId: "welcomer",
  startDate: "2026-11-02",
  welcomerTeamName: null,
  status: "active",
  foundAt: null,
  foundWithClues: null,
  introSeenAt: null,
  revealSeenAt: null,
  lastReadClue: 0,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const beforeReveal = new Date("2026-11-15T13:59:59Z");
const afterReveal = new Date("2026-11-15T14:00:00Z");

beforeEach(() => {
  client.query.mockClear();
  client.query.mockResolvedValue({ rows: [] });
});

describe("finalizeExpiredGameRecord", () => {
  it("leaves a game alone before day 14", async () => {
    await expect(finalizeExpiredGameRecord(game, beforeReveal)).resolves.toBe(game);
    expect(client.query).not.toHaveBeenCalled();
  });

  it("leaves a found game alone after day 14", async () => {
    const found = { ...game, status: "found" as const };
    await expect(finalizeExpiredGameRecord(found, afterReveal)).resolves.toBe(found);
    expect(client.query).not.toHaveBeenCalled();
  });

  it("reveals an active game only while it is still active", async () => {
    await finalizeExpiredGameRecord(game, afterReveal);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /update games set status = \$1, updated_at = \$2 where \(games\.id = \$3 and games\.status = \$4\) returning/,
    );
    expect(update?.params).toEqual(["revealed", expect.any(String), "game_1", "active"]);
  });

  it("clears the player's new hire flag when it reveals the game: the rite of passage is done", async () => {
    const row = [
      "game_1",
      "player",
      "new@inbeat.agency",
      "welcomer",
      "2026-11-02",
      null,
      "revealed",
      null,
      null,
      0,
      null,
      null,
      "2026-11-01T00:00:00Z",
      "2026-11-15T14:00:00Z",
    ];
    client.query.mockResolvedValueOnce({ rows: [row] });
    await finalizeExpiredGameRecord(game, afterReveal);
    const clear = sentStatements(client).find(({ sql }) => sql.startsWith("update people"));
    expect(clear?.sql).toMatch(/^update people set new_hire = \$1.* where people\.id in \(\$\d+\)/);
    expect(clear?.params).toEqual(expect.arrayContaining([false, "player"]));
  });

  it("leaves the flag alone when another request ended the game first", async () => {
    await finalizeExpiredGameRecord(game, afterReveal);
    expect(sentStatements(client).some(({ sql }) => sql.startsWith("update people"))).toBe(false);
  });

  it("rereads the game when another request ended it first", async () => {
    await finalizeExpiredGameRecord(game, afterReveal);
    expect(sentStatements(client)[1]?.sql).toMatch(/from games where games\.id = \$1/);
  });
});
