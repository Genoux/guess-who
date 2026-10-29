import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findLatestWelcomerGame: vi.fn(), finalize: vi.fn() }));
vi.mock("./game-records", () => ({ findLatestWelcomerGame: mocks.findLatestWelcomerGame }));
vi.mock("./finalize-expired-game-record", () => ({ finalizeExpiredGameRecord: mocks.finalize }));

import { findActiveWelcomerGame } from "./find-active-welcomer-game";

const now = new Date("2026-11-05T15:00:00Z");
const game = { id: "game_1", status: "active", startDate: "2026-11-02" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.finalize.mockImplementation(async (value) => value);
});

describe("findActiveWelcomerGame", () => {
  it("returns the game they are welcoming", async () => {
    mocks.findLatestWelcomerGame.mockResolvedValue(game);
    await expect(findActiveWelcomerGame("ana", now)).resolves.toEqual(game);
  });

  it("returns null when they welcome nobody", async () => {
    mocks.findLatestWelcomerGame.mockResolvedValue(undefined);
    await expect(findActiveWelcomerGame("ana", now)).resolves.toBeNull();
  });

  it("returns null once the game ended, even if it was only just found out", async () => {
    mocks.findLatestWelcomerGame.mockResolvedValue(game);
    mocks.finalize.mockResolvedValue({ ...game, status: "revealed" });
    await expect(findActiveWelcomerGame("ana", now)).resolves.toBeNull();
  });
});
