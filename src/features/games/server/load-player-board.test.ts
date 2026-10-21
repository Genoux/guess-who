import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "@/db/schema";
import type { Clue, Collection, Game } from "../types";

const mocks = vi.hoisted(() => ({
  getViewerPerson: vi.fn(),
  findLatestPlayerGame: vi.fn(),
  findPersonById: vi.fn(),
  listAlbumPeople: vi.fn(),
  listTeams: vi.fn(),
  listCollections: vi.fn(),
  listShortlistedIds: vi.fn(),
  listGuesses: vi.fn(),
  listClueRows: vi.fn(),
}));
vi.mock("@/shared/lib/viewer-person", () => ({ getViewerPerson: mocks.getViewerPerson }));
vi.mock("./game-records", () => mocks);
vi.mock("./finalize-expired-game-record", () => ({
  finalizeExpiredGameRecord: async (game: Game) => game,
}));

import { loadPlayerBoard, toPlayerNav } from "./load-player-board";

const person = (id: string, overrides: Partial<Person> = {}): Person => ({
  id,
  clerkUserId: null,
  email: `${id}@example.com`,
  name: `${id[0]?.toUpperCase()}${id.slice(1)} Person`,
  teamId: "creative",
  location: `${id} city`,
  fact: `${id} secret fact`,
  ask: `${id} ask`,
  imageUrl: `https://img.clerk.com/${id}`,
  photoKey: `people/${id}.jpg`,
  stickerNumber: id.length,
  hidden: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const player = person("player", { teamId: null, ask: null });
const welcomer = person("welcomer");
const people = [
  player,
  welcomer,
  person("mateo"),
  person("jonah"),
  person("noor"),
  person("ghost", { hidden: true }),
];

const game = (status: Game["status"]): Game => ({
  id: "game_1",
  playerPersonId: "player",
  playerEmail: "player@example.com",
  welcomerPersonId: "welcomer",
  startDate: "2026-11-02",
  status,
  foundAt: status === "found" ? new Date("2026-11-07T15:00:00Z") : null,
  introSeenAt: null,
  lastReadClue: 1,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const collection = (personId: string, note: string): Collection => ({
  id: `collection_${personId}`,
  gameId: "game_1",
  personId,
  note,
  chatKind: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const clue = (number: number, text: string): Clue => ({
  id: `clue_${number}`,
  gameId: "game_1",
  number,
  text,
  releaseAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const setUp = (status: Game["status"]) => {
  mocks.getViewerPerson.mockResolvedValue({
    userId: "user_player",
    role: "member",
    person: player,
  });
  mocks.findLatestPlayerGame.mockResolvedValue(game(status));
  mocks.findPersonById.mockResolvedValue(welcomer);
  mocks.listAlbumPeople.mockResolvedValue(people);
  mocks.listTeams.mockResolvedValue([
    { id: "creative", name: "Creative", color: "#46BDF0", tint: "#B5E5F9", sortOrder: 1 },
  ]);
  mocks.listCollections.mockResolvedValue([
    collection("mateo", "Owns more records than plates"),
    collection("jonah", "Spreadsheets for everything"),
  ]);
  mocks.listShortlistedIds.mockResolvedValue(["mateo", "noor"]);
  mocks.listGuesses.mockResolvedValue([
    { personId: "jonah", correct: false, createdAt: new Date() },
  ]);
  mocks.listClueRows.mockResolvedValue([clue(2, "Never owned a car"), clue(3, "Plays the cello")]);
};

beforeEach(() => {
  vi.clearAllMocks();
  // Game day 6: clues 1 and 2 are out, 3 and 4 are not.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-07T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadPlayerBoard while the game is active", () => {
  it("returns null without a game", async () => {
    setUp("active");
    mocks.findLatestPlayerGame.mockResolvedValue(undefined);
    await expect(loadPlayerBoard()).resolves.toBeNull();
  });

  it("never sends the welcomer, unreleased clues or locked card fields", async () => {
    setUp("active");
    const board = await loadPlayerBoard();
    const sent = JSON.stringify(board);
    expect(board?.game.welcomerPersonId).toBeNull();
    expect(board?.welcomer).toBeNull();
    expect(sent).not.toContain("Plays the cello");
    for (const locked of ["welcomer", "noor"]) {
      expect(sent).not.toContain(`${locked} secret fact`);
      expect(sent).not.toContain(`${locked} city`);
    }
    expect(sent).not.toContain("people/");
    expect(sent).not.toContain("@example.com");
  });

  it("shows released clues, with clue 1 from the welcomer's team", async () => {
    setUp("active");
    const board = await loadPlayerBoard();
    expect(board?.clues.map((c) => [c.number, c.released, c.text])).toEqual([
      [1, true, "Works in Creative."],
      [2, true, "Never owned a car"],
      [3, false, null],
      [4, false, null],
    ]);
    expect(board?.newClue?.number).toBe(2);
  });

  it("builds the album without the player or hidden people", async () => {
    setUp("active");
    const board = await loadPlayerBoard();
    expect(board?.stickers.map((s) => [s.id, s.mode])).toEqual([
      ["welcomer", "locked"],
      ["mateo", "maybe"],
      ["jonah", "ruled"],
      ["noor", "locked"],
    ]);
    expect(board?.collectedCount).toBe(2);
    expect(board && toPlayerNav(board)).toEqual({
      name: "Player Person",
      color: "#F9D317",
      collectedCount: 2,
      total: 4,
      hasNewClue: true,
    });
  });

  it("gives the player their own notes, on collected stickers only", async () => {
    setUp("active");
    const board = await loadPlayerBoard();
    const notes = Object.fromEntries(board?.stickers.map((s) => [s.id, s.note]) ?? []);
    expect(notes).toEqual({
      welcomer: null,
      mateo: "Owns more records than plates",
      jonah: "Spreadsheets for everything",
      noor: null,
    });
  });
});

describe("loadPlayerBoard once the game is over", () => {
  it("stamps the welcomer found and opens their card", async () => {
    setUp("found");
    const board = await loadPlayerBoard();
    expect(board?.game.welcomerPersonId).toBe("welcomer");
    expect(board?.welcomer).toMatchObject({ id: "welcomer", mode: "found", collected: false });
    expect(board?.welcomer?.person.fact).toBe("welcomer secret fact");
  });

  it("opens the revealed welcomer without counting them as collected", async () => {
    setUp("revealed");
    const board = await loadPlayerBoard();
    expect(board?.welcomer?.mode).toBe("collected");
    expect(board?.collectedCount).toBe(2);
  });
});
