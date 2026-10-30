import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({
  listActiveWelcomerIds: vi.fn(),
  revealExpiredGames: vi.fn(),
  listWelcomerCandidates: vi.fn(),
  findActiveWelcomerGame: vi.fn(),
}));
vi.mock("./game-records", () => ({
  listActiveWelcomerIds: records.listActiveWelcomerIds,
  revealExpiredGames: records.revealExpiredGames,
}));
vi.mock("./people-records", () => ({ listWelcomerCandidates: records.listWelcomerCandidates }));
vi.mock("./find-active-welcomer-game", () => ({
  findActiveWelcomerGame: records.findActiveWelcomerGame,
}));

import { beginMissionRecord } from "./begin-mission-record";
import { NO_WELCOMER_FREE } from "./choose-welcomer";

const candidate = (id: string, overrides = {}) => ({
  id,
  email: `${id}@inbeat.agency`,
  hidden: false,
  teamId: "team_1",
  ask: "Night trains",
  writtenClues: [2, 3, 4],
  ...overrides,
});

const now = new Date("2026-11-02T15:00:00Z");
const start = (overrides = {}) =>
  beginMissionRecord({
    playerEmail: "player@inbeat.agency",
    playerPersonId: "player",
    createdBy: "admin",
    now,
    random: () => 0,
    ...overrides,
  });

/** Postgres' unique violation, as the Neon driver reports it. */
const uniqueViolation = Object.assign(new Error("duplicate key"), { code: "23505" });

const WELCOMER_CLUES = [
  [2, "Has never owned a car."],
  [3, "Learning the cello."],
  [4, "Plays it badly."],
];

type Behaviour = {
  /** The first inserts of games lose the welcomer race. */
  lostInserts?: number;
  /** The first checks find the chosen welcomer already welcomed by the player's own player. */
  clashes?: number;
  /** The email or person already has a mission. */
  hasMission?: boolean;
};

const WELCOMER_TEAM = [["Creative"]];

const behave = ({ lostInserts = 0, clashes = 0, hasMission = false }: Behaviour = {}) => {
  let lost = lostInserts;
  let clash = clashes;
  client.query.mockImplementation(async (config) => {
    const text = config.text.replaceAll('"', "");
    if (text.includes("pg_advisory_xact_lock")) return { rows: [] };
    if (text.startsWith("insert into games")) {
      if (lost-- > 0) throw uniqueViolation;
      return { rows: [["game_1"]] };
    }
    if (text.includes("from welcomer_clues")) return { rows: WELCOMER_CLUES };
    if (text.includes("join teams") || text.includes("from teams")) return { rows: WELCOMER_TEAM };
    if (text.includes("games.welcomer_person_id =")) {
      return { rows: clash-- > 0 ? [["game_9"]] : [] };
    }
    if (text.includes("games.player_email")) return { rows: hasMission ? [["game_9"]] : [] };
    return { rows: [] };
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  client.query.mockReset();
  behave();
  records.listActiveWelcomerIds.mockResolvedValue([]);
  records.revealExpiredGames.mockResolvedValue(0);
  records.listWelcomerCandidates.mockResolvedValue([candidate("ana"), candidate("ben")]);
  records.findActiveWelcomerGame.mockResolvedValue(null);
});

const insert = () => sentStatements(client).find(({ sql }) => sql.startsWith("insert into games"));

describe("beginMissionRecord", () => {
  it("creates the game already started: the picked welcomer and today's Montréal date", async () => {
    await expect(start()).resolves.toEqual({ gameId: "game_1" });
    expect(insert()?.params).toEqual(
      expect.arrayContaining(["player", "player@inbeat.agency", "ana", "2026-11-02", "admin"]),
    );
  });

  it("freezes the welcomer's team name on the game, for clue 1", async () => {
    await start();
    expect(insert()?.sql).toMatch(/welcomer_team_name/);
    expect(insert()?.params).toContain("Creative");
  });

  it("snapshots the welcomer's clues into the game's own", async () => {
    await start();
    const statements = sentStatements(client);
    const read = statements.find(({ sql }) => sql.includes("from welcomer_clues"));
    expect(read?.params).toEqual(["ana"]);
    const snapshot = statements.find(({ sql }) => sql.startsWith("insert into clues"));
    expect(snapshot?.params).toEqual([
      "game_1",
      2,
      "Has never owned a car.",
      "game_1",
      3,
      "Learning the cello.",
      "game_1",
      4,
      "Plays it badly.",
    ]);
  });

  it("frees welcomers whose mission ran past day 14 before picking", async () => {
    await start();
    expect(records.revealExpiredGames).toHaveBeenCalledWith(now);
    expect(records.listActiveWelcomerIds).toHaveBeenCalledWith(now);
  });

  it("does not pick the player or the person the player welcomes", async () => {
    records.listWelcomerCandidates.mockResolvedValue([
      candidate("player"),
      candidate("ana"),
      candidate("ben"),
    ]);
    records.findActiveWelcomerGame.mockResolvedValue({ id: "game_9", playerPersonId: "ana" });
    await start();
    expect(insert()?.params).toContain("ben");
  });

  it("picks for an invite with no person row yet, and links no player to the game", async () => {
    await start({ playerPersonId: null });
    expect(records.findActiveWelcomerGame).not.toHaveBeenCalled();
    expect(insert()?.params).toEqual(expect.arrayContaining([null, "player@inbeat.agency", "ana"]));
  });

  it("answers a conflict when nobody is eligible, and writes nothing", async () => {
    records.listWelcomerCandidates.mockResolvedValue([]);
    await expect(start()).rejects.toMatchObject({ safeMessage: NO_WELCOMER_FREE });
    expect(client.query).not.toHaveBeenCalled();
  });

  it("serializes starts and checks inside the transaction that the pick does not welcome its own player", async () => {
    await start();
    const sql = sentStatements(client).map((statement) => statement.sql);
    const lock = sql.findIndex((text) => text.includes("pg_advisory_xact_lock"));
    const check = sql.findIndex((text) => text.includes("games.welcomer_person_id = $"));
    const write = sql.findIndex((text) => text.startsWith("insert into games"));
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(lock).toBeLessThan(check);
    expect(check).toBeLessThan(write);
  });

  it("refuses a second mission for the same email or person, inside the lock", async () => {
    behave({ hasMission: true });
    await expect(start()).rejects.toMatchObject({
      kind: "conflict",
      safeMessage: "This email already has a mission.",
    });
    expect(insert()).toBeUndefined();
  });

  it("runs the caller's step in the same transaction, and links the game to the person it returns", async () => {
    const prepare = vi.fn(async () => "person_9");
    await start({ playerPersonId: null, prepare });
    expect(prepare).toHaveBeenCalledOnce();
    expect(insert()?.params).toContain("person_9");
    const sql = sentStatements(client).map((s) => s.sql.trim());
    expect(sql[0]).toBe("begin");
    expect(sql.at(-1)).toBe("commit");
  });

  it("picks again when a concurrent start made the pick welcome the player's own player", async () => {
    behave({ clashes: 1 });
    records.findActiveWelcomerGame.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "game_9",
      playerPersonId: "ana",
    });
    await start();
    const inserts = sentStatements(client).filter(({ sql }) => sql.startsWith("insert into games"));
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.params).toContain("ben");
    expect(records.findActiveWelcomerGame).toHaveBeenCalledTimes(2);
  });

  it("gives up with a conflict when the second pick clashes too", async () => {
    behave({ clashes: 2 });
    await expect(start()).rejects.toMatchObject({ safeMessage: NO_WELCOMER_FREE });
    expect(insert()).toBeUndefined();
  });

  it("retries the pick once when another start took the welcomer first", async () => {
    behave({ lostInserts: 1 });
    records.listActiveWelcomerIds.mockResolvedValueOnce([]).mockResolvedValueOnce(["ana"]);
    await start();
    const inserts = sentStatements(client).filter(({ sql }) => sql.startsWith("insert into games"));
    expect(inserts.map(({ params }) => params.includes("ben"))).toEqual([false, true]);
  });

  it("gives up with a conflict when the retry loses the race too", async () => {
    behave({ lostInserts: 2 });
    await expect(start()).rejects.toMatchObject({ safeMessage: NO_WELCOMER_FREE });
  });
});
