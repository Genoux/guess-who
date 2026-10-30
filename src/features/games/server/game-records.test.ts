import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import {
  countAlbum,
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
  revealExpiredGames,
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

  it("scopes collections to the collector, not to a game", async () => {
    await listCollections("viewer");
    expect(last().sql).toMatch(/from collections where collections\.collector_person_id = \$1/);
    expect(last().params).toEqual(["viewer"]);
  });

  it.each([
    ["shortlists", listShortlistedIds, /from shortlists where shortlists\.game_id = \$1/],
    ["guesses", listGuesses, /from guesses where guesses\.game_id = \$1/],
  ] as const)("scopes %s to the game", async (_name, list, pattern) => {
    await list("game_1");
    expect(last().sql).toMatch(pattern);
    expect(last().params).toEqual(["game_1"]);
  });

  it("checks a collection by collector and a guess by game, each with the person", async () => {
    await expect(hasCollected("viewer", "teammate")).resolves.toBe(false);
    expect(last().sql).toMatch(
      /from collections where \(collections\.collector_person_id = \$1 and collections\.person_id = \$2\)/,
    );
    client.query.mockResolvedValueOnce({ rows: [["guess_1"]] });
    await expect(hasGuessed("game_1", "teammate")).resolves.toBe(true);
    expect(last().sql).toMatch(
      /from guesses where \(guesses\.game_id = \$1 and guesses\.person_id = \$2\)/,
    );
  });
});

describe("mission lookups", () => {
  it("finds a game by id", async () => {
    await expect(findGameById("game_1")).resolves.toBeUndefined();
    expect(last().sql).toMatch(/from games where games\.id = \$1/);
    expect(last().params).toEqual(["game_1", 1]);
  });

  it("lists the people welcoming a mission that is still running, not one past day 14", async () => {
    client.query.mockResolvedValueOnce({ rows: [["ana"], ["ben"]] });
    await expect(listActiveWelcomerIds(new Date("2026-10-28T15:00:00Z"))).resolves.toEqual([
      "ana",
      "ben",
    ]);
    expect(last().sql).toMatch(
      /select welcomer_person_id from games where \(games\.status = \$1 and games\.welcomer_person_id is not null and games\.start_date > \$2\)/,
    );
    expect(last().params).toEqual(["active", "2026-10-15"]);
  });

  it("ends the missions that ran past day 14, so their welcomers can be picked again", async () => {
    client.query.mockResolvedValueOnce({ rows: [["p1"], ["p2"]] });
    await expect(revealExpiredGames(new Date("2026-10-28T15:00:00Z"))).resolves.toBe(2);
    const [reveal] = sentStatements(client);
    expect(reveal?.sql).toMatch(
      /^update games set status = \$1.* where \(games\.status = \$\d and games\.welcomer_person_id is not null and games\.start_date <= \$\d\)/,
    );
    expect(reveal?.params).toEqual(expect.arrayContaining(["revealed", "active", "2026-10-15"]));
  });

  it("clears the new hire flag of every player whose mission it ended", async () => {
    client.query.mockResolvedValueOnce({ rows: [["p1"], ["p2"]] });
    await revealExpiredGames(new Date("2026-10-28T15:00:00Z"));
    const clear = sentStatements(client).find(({ sql }) => sql.startsWith("update people"));
    expect(clear?.params).toEqual(expect.arrayContaining([false, "p1", "p2"]));
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

describe("countAlbum", () => {
  it("counts the stickers in the album and the ones collected, for the top bar", async () => {
    client.query.mockResolvedValueOnce({ rows: [["19"]] }).mockResolvedValueOnce({ rows: [["5"]] });
    await expect(countAlbum("viewer", null)).resolves.toEqual({ collected: 5, total: 19 });
    const [total, collected] = sentStatements(client).slice(-2);
    expect(total?.sql).toMatch(
      /select count\(\*\) from people where \(people\.id <> \$1 and people\.hidden = \$2 and people\.team_id is not null and btrim\(coalesce\(people\.ask, ''\)\) <> ''\)/,
    );
    expect(collected?.sql).toMatch(
      /from collections inner join people on collections\.person_id = people\.id where \(collections\.collector_person_id = \$1 and /,
    );
  });

  it("keeps the welcomer of a running mission in the album whatever their card says", async () => {
    client.query.mockResolvedValue({ rows: [["1"]] });
    await countAlbum("viewer", "welcomer");
    const [total] = sentStatements(client).slice(-2);
    expect(total?.sql).toMatch(/or people\.id = \$\d+\)/);
    expect(total?.params).toContain("welcomer");
  });
});
