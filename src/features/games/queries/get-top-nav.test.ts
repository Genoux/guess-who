import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadPlayerGame: vi.fn(),
  countAlbum: vi.fn(),
  getIsWelcomer: vi.fn(),
  loadPlayerBoard: vi.fn(),
}));
vi.mock("../server/load-player-board", () => ({
  loadPlayerGame: mocks.loadPlayerGame,
  loadPlayerBoard: mocks.loadPlayerBoard,
}));
vi.mock("../server/game-records", () => ({ countAlbum: mocks.countAlbum }));
vi.mock("./get-is-welcomer", () => ({ getIsWelcomer: mocks.getIsWelcomer }));

import { getTopNav } from "./get-top-nav";

const playing = {
  status: "active",
  welcomerPersonId: "ana",
  startDate: "2026-11-02",
  lastReadClue: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-04T15:00:00Z"));
  mocks.loadPlayerGame.mockResolvedValue({
    game: playing,
    viewer: { personId: "me", role: "member" },
    person: { newHire: false },
  });
  mocks.countAlbum.mockResolvedValue({ collected: 5, total: 19 });
  mocks.getIsWelcomer.mockResolvedValue(false);
});

describe("getTopNav", () => {
  it("answers from a few counts, never from the whole board", async () => {
    await expect(getTopNav()).resolves.toEqual({
      hasMission: true,
      hasNewClue: true,
      collectedCount: 5,
      total: 19,
      admin: false,
      welcomer: false,
      locked: false,
    });
    expect(mocks.loadPlayerBoard).not.toHaveBeenCalled();
  });

  it("counts the album with the welcomer of a running mission kept in it", async () => {
    await getTopNav();
    expect(mocks.countAlbum).toHaveBeenCalledWith("me", "ana");
  });

  it("is locked for a new hire, whatever their card and mission look like", async () => {
    const viewer = { personId: "me", role: "member" };
    mocks.loadPlayerGame.mockResolvedValue({ game: playing, viewer, person: { newHire: true } });
    await expect(getTopNav()).resolves.toMatchObject({ locked: true });
    mocks.loadPlayerGame.mockResolvedValue({ game: null, viewer, person: { newHire: true } });
    await expect(getTopNav()).resolves.toMatchObject({ locked: true, hasMission: false });
  });

  it("is not locked for anyone else, with no card and no mission included", async () => {
    mocks.loadPlayerGame.mockResolvedValue({
      game: null,
      viewer: { personId: "me", role: "member" },
      person: { newHire: false, teamId: null, ask: null },
    });
    await expect(getTopNav()).resolves.toMatchObject({ locked: false });
  });

  it("shows no Mission tab without a game, and no welcomer exception", async () => {
    mocks.loadPlayerGame.mockResolvedValue({
      game: null,
      viewer: { personId: "me", role: "admin" },
      person: { newHire: false },
    });
    await expect(getTopNav()).resolves.toMatchObject({
      hasMission: false,
      hasNewClue: false,
      admin: true,
    });
    expect(mocks.countAlbum).toHaveBeenCalledWith("me", null);
  });

  it("keeps the Mission tab once the mission is over, with no welcomer exception", async () => {
    mocks.loadPlayerGame.mockResolvedValue({
      game: { ...playing, status: "found" },
      viewer: { personId: "me", role: "member" },
      person: { newHire: false },
    });
    await expect(getTopNav()).resolves.toMatchObject({ hasMission: true, hasNewClue: false });
    expect(mocks.countAlbum).toHaveBeenCalledWith("me", null);
  });
});
