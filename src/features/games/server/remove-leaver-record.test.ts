import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ revealExpiredGames: vi.fn(async () => 0) }));
vi.mock("./game-records", () => records);

import { removeLeaverRecord } from "./remove-leaver-record";

const now = new Date("2026-11-03T15:00:00Z");
const input = { deelId: "deel_kim", now };
const sent = () => sentStatements(client);
const statement = (verb: string) => sent().find(({ sql }) => sql.startsWith(verb));

/** The person exists unless `missing`; `players` are those whose running game the leaver welcomed. */
const behave = ({ missing = false, players = [] as string[] } = {}) =>
  client.query.mockImplementation(async (config) => {
    const text = config.text.replaceAll('"', "");
    if (text.startsWith("select") && text.includes("from people")) {
      return { rows: missing ? [] : [["kim", "kim@gmail.com"]] };
    }
    if (text.startsWith("delete from games") && text.includes("welcomer_person_id")) {
      return { rows: players.map((player) => [player]) };
    }
    return { rows: [] };
  });

beforeEach(() => {
  client.query.mockReset();
  records.revealExpiredGames.mockClear();
  behave();
});

describe("removeLeaverRecord", () => {
  it("takes the mission-start lock before touching rows", async () => {
    await removeLeaverRecord(input);
    expect(sent()[1]?.sql).toContain("pg_advisory_xact_lock");
  });

  it("deletes the running game they welcome, then the games they play, then the person", async () => {
    await removeLeaverRecord(input);
    const deletes = sent().filter(({ sql }) => sql.startsWith("delete from"));
    expect(deletes.map(({ sql }) => sql.split(" where")[0])).toEqual([
      "delete from games",
      "delete from games",
      "delete from people",
    ]);
    expect(deletes[0]?.sql).toMatch(/welcomer_person_id = \$\d+ and .*status = \$\d+/);
    expect(deletes[0]?.params).toContain("active");
    expect(deletes[1]?.sql).toMatch(/player_person_id = \$\d+/);
    expect(deletes[2]?.params).toEqual(["kim"]);
  });

  it("also deletes a legacy game of theirs not yet linked, found by player_email", async () => {
    await removeLeaverRecord(input);
    const own = sent().filter(({ sql }) => sql.startsWith("delete from games"))[1];
    expect(own?.sql).toMatch(
      /player_person_id = \$\d+ or .*player_person_id is null and .*player_email = \$\d+/,
    );
    expect(own?.params).toEqual(["kim", "kim@gmail.com"]);
  });

  it("resets the player of the welcomed game: marker cleared, welcomer_left_at set", async () => {
    behave({ players: ["sam"] });
    await removeLeaverRecord(input);
    const update = statement("update people");
    expect(update?.sql).toMatch(/auto_mission_done_at = \$\d+, .*welcomer_left_at = \$\d+/);
    expect(update?.sql).not.toMatch(/new_hire/);
    expect(update?.params).toEqual([null, now.toISOString(), expect.any(String), "sam"]);
  });

  it("never marks a player when the welcomed game was not running", async () => {
    await removeLeaverRecord(input);
    expect(statement("update people")).toBeUndefined();
  });

  it("leaves finished games alone: only active games they welcome are deleted", async () => {
    await removeLeaverRecord(input);
    expect(statement("delete from games")?.sql).toMatch(/status = \$\d+/);
  });

  it("frees missions past day 14 first, so they are revealed instead of reset", async () => {
    await removeLeaverRecord(input);
    expect(records.revealExpiredGames).toHaveBeenCalledWith(now);
  });

  it("does nothing for an unknown id", async () => {
    behave({ missing: true });
    expect(await removeLeaverRecord(input)).toBe("unknown person");
    expect(statement("delete from")).toBeUndefined();
    expect(statement("update")).toBeUndefined();
  });
});
