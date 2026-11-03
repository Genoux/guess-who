import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("./db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
const finalize = vi.hoisted(() => ({ finalizeExpiredGameRecord: vi.fn() }));
vi.mock("./finalize-expired-game-record", () => finalize);

import { assertCardUnlocked } from "./card-access";

const GAME_ROW = [
  "game_1",
  "person_1",
  "new@inbeat.agency",
  "welcomer",
  "2026-11-02",
  null,
  "active",
  null,
  null,
  null,
  0,
  null,
  null,
  "2026-11-02T00:00:00Z",
  "2026-11-02T00:00:00Z",
];
const newHire = { id: "person_1", newHire: true };
const lockedWithReason = expect.toSatisfy(
  (err) => isAppError(err, "forbidden") && err.safeMessage === "Finish your mission first.",
);

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [GAME_ROW] });
  finalize.finalizeExpiredGameRecord.mockReset();
  finalize.finalizeExpiredGameRecord.mockImplementation(async (game) => game);
});

describe("assertCardUnlocked", () => {
  it("refuses a new hire with a running mission, with the reason", async () => {
    await expect(assertCardUnlocked(newHire)).rejects.toThrow(lockedWithReason);
  });

  it("refuses a new hire with no mission yet", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(assertCardUnlocked(newHire)).rejects.toThrow(lockedWithReason);
  });

  it("ends a mission that ran past day 14 first, so the new hire is unlocked right away", async () => {
    finalize.finalizeExpiredGameRecord.mockImplementation(async (game) => ({
      ...game,
      status: "revealed",
    }));
    await expect(assertCardUnlocked(newHire)).resolves.toBeUndefined();
    expect(finalize.finalizeExpiredGameRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: "game_1" }),
      expect.any(Date),
    );
  });

  it("lets everyone else through without reading a game, even with no card and no mission", async () => {
    await expect(assertCardUnlocked({ id: "person_2", newHire: false })).resolves.toBeUndefined();
    expect(client.query).not.toHaveBeenCalled();
  });
});
