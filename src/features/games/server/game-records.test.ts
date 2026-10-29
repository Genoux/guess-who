import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import {
  findGameById,
  findLatestPlayerGame,
  findLatestWelcomerGame,
  hasCollected,
  hasGuessed,
  listActiveWelcomerIds,
  listAlbumPeople,
  listCollections,
  listGuesses,
  listShortlistedIds,
  listWelcomerClues,
} from "./game-records";

const last = () => sentStatements(client).at(-1) ?? { sql: "", params: [] };

beforeEach(() => {
  client.query.mockClear();
  client.query.mockResolvedValue({ rows: [] });
});

describe("game lookups", () => {
  it("prefers the player's active game, then the newest", async () => {
    await expect(findLatestPlayerGame("player")).resolves.toBeUndefined();
    expect(last().sql).toMatch(
      /from games where games\.player_person_id = \$1 order by \(games\.status = 'active'\) desc, games\.created_at desc limit \$2/,
    );
    expect(last().params).toEqual(["player", 1]);
  });

  it("finds the welcomer's game the same way", async () => {
    await findLatestWelcomerGame("welcomer");
    expect(last().sql).toMatch(/where games\.welcomer_person_id = \$1 order by \(games\.status/);
  });
});

describe("album reads", () => {
  it("lists visible people with a team in sticker order", async () => {
    await listAlbumPeople();
    expect(last().sql).toMatch(
      /from people where \(people\.hidden = \$1 and people\.team_id is not null\) order by people\.sticker_number asc/,
    );
    expect(last().params).toEqual([false]);
  });

  it.each([
    ["collections", listCollections, /from collections where collections\.game_id = \$1/],
    ["shortlists", listShortlistedIds, /from shortlists where shortlists\.game_id = \$1/],
    ["guesses", listGuesses, /from guesses where guesses\.game_id = \$1/],
  ] as const)("scopes %s to the game", async (_name, list, pattern) => {
    await list("game_1");
    expect(last().sql).toMatch(pattern);
    expect(last().params).toEqual(["game_1"]);
  });

  it("checks a collection and a guess by game and person", async () => {
    await expect(hasCollected("game_1", "teammate")).resolves.toBe(false);
    expect(last().sql).toMatch(
      /from collections where \(collections\.game_id = \$1 and collections\.person_id = \$2\)/,
    );
    client.query.mockResolvedValueOnce({ rows: [["guess_1"]] });
    await expect(hasGuessed("game_1", "teammate")).resolves.toBe(true);
    expect(last().sql).toMatch(
      /from guesses where \(guesses\.game_id = \$1 and guesses\.person_id = \$2\)/,
    );
  });
});

describe("new hire lookups", () => {
  it("finds a game by id", async () => {
    await expect(findGameById("game_1")).resolves.toBeUndefined();
    expect(last().sql).toMatch(/from games where games\.id = \$1/);
    expect(last().params).toEqual(["game_1", 1]);
  });

  it("lists the people welcoming an active game", async () => {
    client.query.mockResolvedValueOnce({ rows: [["ana"], ["ben"]] });
    await expect(listActiveWelcomerIds()).resolves.toEqual(["ana", "ben"]);
    expect(last().sql).toMatch(/select welcomer_person_id from games where games\.status = \$1/);
    expect(last().params).toEqual(["active"]);
  });
});

describe("welcomer clues", () => {
  it("lists a person's own clues in order", async () => {
    await listWelcomerClues("welcomer");
    expect(last().sql).toMatch(
      /from welcomer_clues where welcomer_clues\.person_id = \$1 order by welcomer_clues\.number asc/,
    );
    expect(last().params).toEqual(["welcomer"]);
  });
});
