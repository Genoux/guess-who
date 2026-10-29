import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ listWelcomerClues: vi.fn(), findActiveWelcomerGame: vi.fn() }));
vi.mock("./game-records", () => ({ listWelcomerClues: records.listWelcomerClues }));
vi.mock("./find-active-welcomer-game", () => ({
  findActiveWelcomerGame: records.findActiveWelcomerGame,
}));

import { writeClueRecord } from "./write-clue-record";

const game = { id: "game_1", startDate: "2026-11-02", status: "active" as const };
const day4 = new Date("2026-11-05T15:00:00Z");
const beforeStart = new Date("2026-11-01T15:00:00Z");
const write = (overrides: Partial<Parameters<typeof writeClueRecord>[0]> = {}) =>
  writeClueRecord({
    personId: "teammate",
    number: 2,
    text: "Has never owned a car.",
    now: beforeStart,
    ...overrides,
  });

beforeEach(() => {
  client.query.mockClear();
  records.listWelcomerClues.mockReset();
  records.listWelcomerClues.mockResolvedValue([]);
  records.findActiveWelcomerGame.mockReset();
  records.findActiveWelcomerGame.mockResolvedValue(game);
});

describe("writeClueRecord", () => {
  it("saves the clue on the person, not on a game", async () => {
    await write();
    const [upsert] = sentStatements(client);
    expect(upsert?.sql).toMatch(
      /insert into welcomer_clues .* on conflict \(person_id,number\) do update set text = \$\d+/,
    );
    expect(upsert?.params).toEqual(
      expect.arrayContaining(["teammate", 2, "Has never owned a car."]),
    );
  });

  it("lets a teammate who welcomes no game write, even while others play", async () => {
    records.findActiveWelcomerGame.mockResolvedValue(null);
    records.listWelcomerClues.mockResolvedValue([{ number: 2, text: "Old" }]);
    await expect(write({ now: day4 })).resolves.toBeUndefined();
  });

  it("edits a saved clue before their game starts", async () => {
    records.listWelcomerClues.mockResolvedValue([{ number: 2, text: "Old" }]);
    await expect(write()).resolves.toBeUndefined();
  });

  it("refuses to change a saved clue while their game is playing", async () => {
    records.listWelcomerClues.mockResolvedValue([{ number: 2, text: "Old" }]);
    await expect(write({ now: day4 })).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("writes a clue that was never written while their game is playing", async () => {
    records.listWelcomerClues.mockResolvedValue([{ number: 3, text: "Other" }]);
    await expect(write({ now: day4 })).resolves.toBeUndefined();
  });

  it("refuses the generated team clue", async () => {
    await expect(write({ number: 1 })).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});
