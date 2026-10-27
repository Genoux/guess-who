import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ hasCollected: vi.fn(), hasGuessed: vi.fn() }));
vi.mock("./game-records", () => records);

import { guessWelcomerRecord } from "./guess-welcomer-record";

const game = {
  id: "game_1",
  playerPersonId: "player",
  welcomerPersonId: "welcomer",
  status: "active" as const,
  startDate: "2026-11-02",
};
const now = new Date("2026-11-07T15:00:00Z");
const guess = (personId: string) =>
  guessWelcomerRecord({ game, viewerPersonId: "player", personId, now });
const statements = () => sentStatements(client).map((statement) => statement.sql.trim());

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [[2]] });
  records.hasCollected.mockResolvedValue(true);
  records.hasGuessed.mockResolvedValue(false);
});

describe("guessWelcomerRecord", () => {
  it("ends the game as found on the right guess, with the day and the clues it took", async () => {
    await expect(guess("welcomer")).resolves.toEqual({
      correct: true,
      foundOnDay: 6,
      cluesUsed: 2,
    });
    const sql = statements();
    expect(sql[0]).toBe("begin");
    expect(sql[1]).toMatch(/insert into guesses/);
    expect(sql[2]).toMatch(
      /update games set status = \$1, found_at = \$2, reveal_seen_at = \$3, found_with_clues = games\.last_read_clue, updated_at = \$4 where \(games\.id = \$5 and games\.status = \$6\) returning/,
    );
    expect(sql.at(-1)).toBe("commit");
    expect(sentStatements(client)[1]?.params).toEqual(
      expect.arrayContaining(["game_1", "welcomer", true]),
    );
  });

  it("rules out a wrong guess and drops them from the maybe list", async () => {
    await expect(guess("teammate")).resolves.toEqual({ correct: false });
    const sql = statements();
    expect(sql[1]).toMatch(/insert into guesses/);
    expect(sql[2]).toMatch(/delete from shortlists where/);
    expect(sql.join("\n")).not.toMatch(/update games/);
    expect(sentStatements(client)[1]?.params).toEqual(
      expect.arrayContaining(["game_1", "teammate", false]),
    );
  });

  it("refuses a sticker the player has not collected", async () => {
    records.hasCollected.mockResolvedValue(false);
    await expect(guess("welcomer")).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses a person who was already guessed", async () => {
    records.hasGuessed.mockResolvedValue(true);
    await expect(guess("teammate")).rejects.toSatisfy((err) => isAppError(err, "conflict"));
  });

  it("rolls back when the game ended in the meantime", async () => {
    client.query.mockImplementation(async (config: { text: string }) =>
      config.text.startsWith("update") ? { rows: [] } : { rows: [["guess_1"]] },
    );
    await expect(guess("welcomer")).rejects.toSatisfy((err) => isAppError(err, "conflict"));
    expect(statements().at(-1)).toBe("rollback");
  });

  it("turns a duplicate guess race into a conflict", async () => {
    client.query.mockImplementation(async (config: { text: string }) => {
      if (config.text.startsWith("insert")) {
        throw Object.assign(new Error("duplicate key"), { code: "23505" });
      }
      return { rows: [] };
    });
    await expect(guess("teammate")).rejects.toSatisfy((err) => isAppError(err, "conflict"));
  });
});
