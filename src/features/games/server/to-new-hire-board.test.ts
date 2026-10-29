import { describe, expect, it } from "vitest";
import {
  type GameActivity,
  type NewHireGameRow,
  toNewHireBoard,
  type WelcomerCandidate,
} from "./to-new-hire-board";

const now = new Date("2026-10-28T15:00:00Z");

const game = (overrides: Partial<NewHireGameRow> = {}): NewHireGameRow => ({
  id: "game",
  playerEmail: "sam@gmail.com",
  playerPersonId: null,
  playerName: null,
  startDate: "2026-10-26",
  status: "active",
  foundAt: null,
  creatorName: null,
  welcomerPersonId: "ana",
  welcomerName: "Ana Ferreira",
  welcomerColor: "#46BDF0",
  welcomerTeam: "Creative",
  ...overrides,
});

const candidate = (id: string, overrides: Partial<WelcomerCandidate> = {}): WelcomerCandidate => ({
  id,
  name: `${id[0]?.toUpperCase()}${id.slice(1)} Lopez`,
  email: `${id}@inbeat.agency`,
  hidden: false,
  teamId: "team_1",
  ask: "Night trains",
  writtenClues: [2, 3, 4],
  team: "Strategy",
  color: "#157428",
  ...overrides,
});

const board = (
  games: NewHireGameRow[],
  welcomers: { candidates?: WelcomerCandidate[]; busyWelcomerIds?: string[] } = {},
  activity: GameActivity[] = [],
) =>
  toNewHireBoard({
    games,
    activity,
    candidates: welcomers.candidates ?? [],
    busyWelcomerIds: welcomers.busyWelcomerIds ?? [],
    now,
  });

describe("toNewHireBoard", () => {
  it("carries today in Montréal for the form", () => {
    expect(board([]).today).toBe("2026-10-28");
  });

  it("has no groups without games", () => {
    expect(board([]).groups).toEqual([]);
  });

  it("groups by phase and drops the empty ones", () => {
    const { groups } = board([
      game({ id: "done", status: "revealed" }),
      game({ id: "soon", startDate: "2026-11-02" }),
      game({ id: "now" }),
    ]);
    expect(groups.map(({ key, label }) => [key, label])).toEqual([
      ["playing", "Playing"],
      ["upcoming", "Starting soon"],
      ["done", "Done"],
    ]);
    expect(groups.map(({ rows }) => rows.map(({ id }) => id))).toEqual([
      ["now"],
      ["soon"],
      ["done"],
    ]);
  });

  it("orders games in play and upcoming by first day, and done games most recent first", () => {
    const ids = (key: string, games: NewHireGameRow[]) =>
      board(games)
        .groups.find((group) => group.key === key)
        ?.rows.map(({ id }) => id);
    expect(
      ids("playing", [
        game({ id: "later", startDate: "2026-10-27" }),
        game({ id: "earlier", startDate: "2026-10-20" }),
      ]),
    ).toEqual(["earlier", "later"]);
    expect(
      ids("done", [
        game({ id: "older", status: "found", startDate: "2026-09-01", foundAt: now }),
        game({ id: "newer", status: "revealed", startDate: "2026-10-05" }),
      ]),
    ).toEqual(["newer", "older"]);
  });

  it("shows the linked player's name, or only the email", () => {
    const [named, bare] = board([
      game({ id: "named", playerPersonId: "p", playerName: "Sam Taylor" }),
      game({ id: "bare", startDate: "2026-10-27" }),
    ]).groups.flatMap(({ rows }) => rows);
    expect(named).toMatchObject({ name: "Sam Taylor", email: "sam@gmail.com" });
    expect(bare).toMatchObject({ name: null });
  });

  it("flags a sign-in that is missing from day 2", () => {
    const [row] = board([game()]).groups.flatMap(({ rows }) => rows);
    expect(row?.signInWarning).toBe(true);
  });

  it("lets an unlinked, unfinished game be edited, and tells if it started", () => {
    const [started, upcoming, done] = [
      game({ id: "started" }),
      game({ id: "upcoming", startDate: "2026-11-02" }),
      game({ id: "done", status: "found", foundAt: now }),
    ].flatMap((row) => board([row]).groups.flatMap(({ rows }) => rows));
    expect([started, upcoming, done].map((row) => [row?.editable, row?.started])).toEqual([
      [true, true],
      [true, false],
      [false, true],
    ]);
  });

  it("lets a linked game be edited before it starts, but not its email", () => {
    const [row] = board([
      game({ startDate: "2026-11-02", playerPersonId: "player", playerName: "Sam Taylor" }),
    ]).groups.flatMap(({ rows }) => rows);
    expect(row).toMatchObject({ editable: true, emailEditable: false, started: false });
  });

  it("shapes the welcomer and the status", () => {
    const [row] = board([game({ startDate: "2026-10-27" })]).groups.flatMap(({ rows }) => rows);
    expect(row).toMatchObject({
      welcomer: { id: "ana", name: "Ana Ferreira", color: "#46BDF0" },
      status: { label: "Day 2 of 14", tone: "dark" },
    });
  });
});

describe("player progress", () => {
  const signedIn = game({ id: "g", playerPersonId: "player", playerName: "Sam Taylor" });
  const rowFor = (row: NewHireGameRow, activity: GameActivity[]) =>
    board([row], {}, activity).groups.flatMap(({ rows }) => rows)[0];

  it("shows the stickers of a game in play and when the player was last active", () => {
    expect(
      rowFor(signedIn, [
        {
          gameId: "g",
          collected: 2,
          lastActiveAt: new Date("2026-10-28T13:00:00Z"),
        },
      ])?.progress,
    ).toEqual({ label: "2 stickers", activity: "Active 2 hours ago" });
  });

  it("starts a game without activity at none", () => {
    expect(rowFor(signedIn, [])?.progress?.label).toBe("0 stickers");
  });

  it("shows progress on a done game and none on a game starting soon", () => {
    const done = game({ id: "g", status: "revealed", playerPersonId: "player" });
    const soon = game({ id: "g", startDate: "2026-11-02" });
    expect(rowFor(done, [])?.progress).not.toBeNull();
    expect(rowFor(soon, [])?.progress).toBeNull();
  });

  it("flags a signed-in player idle for three days", () => {
    const idle: GameActivity = {
      gameId: "g",
      collected: 1,
      lastActiveAt: new Date("2026-10-24T15:00:00Z"),
    };
    expect(rowFor(signedIn, [idle])?.stalledDays).toBe(4);
    expect(rowFor(signedIn, [{ ...idle, lastActiveAt: now }])?.stalledDays).toBeNull();
  });

  it("never flags both a missing sign-in and a stalled player", () => {
    const row = rowFor(game({ id: "g", startDate: "2026-10-20" }), []);
    expect(row).toMatchObject({ signInWarning: true, stalledDays: null });
  });
});

describe("welcomer options", () => {
  const optionIds = (games: NewHireGameRow[], welcomers: Parameters<typeof board>[1]) =>
    board(games, welcomers)
      .groups.flatMap(({ rows }) => rows)
      .map(({ id, welcomerOptions }) => [id, welcomerOptions.map(({ id: optionId }) => optionId)]);

  const candidates = [candidate("ana"), candidate("ben"), candidate("cleo"), candidate("dev")];

  it("offers an editable game its welcomer first, then every free teammate", () => {
    expect(
      optionIds([game({ id: "g" })], { candidates, busyWelcomerIds: ["ana", "cleo"] }),
    ).toEqual([["g", ["ana", "ben", "dev"]]]);
  });

  it("keeps the current welcomer even when their card no longer qualifies", () => {
    expect(
      optionIds([game({ id: "g" })], {
        candidates: [candidate("ana", { hidden: true }), candidate("ben")],
        busyWelcomerIds: ["ana"],
      }),
    ).toEqual([["g", ["ana", "ben"]]]);
  });

  it("leaves the new hire out of the options", () => {
    expect(
      optionIds([game({ id: "g", playerEmail: "dev@inbeat.agency" })], {
        candidates,
        busyWelcomerIds: ["ana"],
      }),
    ).toEqual([["g", ["ana", "ben", "cleo"]]]);
  });

  it("gives a game that cannot be edited no options", () => {
    expect(optionIds([game({ id: "g", status: "found", foundAt: now })], { candidates })).toEqual([
      ["g", []],
    ]);
  });

  it("labels each option with the teammate and their team", () => {
    const [row] = board([game()], { candidates, busyWelcomerIds: ["ana"] }).groups.flatMap(
      ({ rows }) => rows,
    );
    expect(row?.welcomerOptions[0]).toEqual({
      id: "ana",
      name: "Ana Ferreira",
      team: "Creative",
      color: "#46BDF0",
    });
    expect(row?.welcomerOptions[1]).toEqual({
      id: "ben",
      name: "Ben Lopez",
      team: "Strategy",
      color: "#157428",
    });
  });
});

describe("readiness", () => {
  const pool = [
    candidate("ana"),
    candidate("ben", { writtenClues: [2, 3] }),
    candidate("cleo", { writtenClues: [] }),
    candidate("dev", { teamId: null, team: null, color: null }),
    candidate("eli", { ask: " " }),
    candidate("player"),
  ];
  const readiness = (games: NewHireGameRow[] = [], candidates = pool) =>
    board(games, { candidates }).readiness;

  it("counts who has a finished card and all three clues against everyone who could welcome", () => {
    expect(readiness()).toMatchObject({ ready: 2, total: 6 });
  });

  it("leaves out whoever is the player of an active game", () => {
    const games = [game({ id: "g", playerPersonId: "player", playerName: "Player Lopez" })];
    expect(readiness(games)).toMatchObject({ ready: 1, total: 5 });
  });

  it("keeps someone whose game is over, since they are a teammate now", () => {
    const games = [
      game({ id: "g", playerPersonId: "player", status: "revealed", playerName: "Player Lopez" }),
    ];
    expect(readiness(games).total).toBe(6);
  });

  it("lists who is missing, the least ready first, with what is missing", () => {
    expect(readiness().missing.map(({ name, label }) => [name, label])).toEqual([
      ["Dev Lopez", "Card not finished"],
      ["Eli Lopez", "Card not finished"],
      ["Cleo Lopez", "0 of 3 clues"],
      ["Ben Lopez", "2 of 3 clues"],
    ]);
  });

  it("gives each missing teammate what the dialog shows", () => {
    expect(readiness().missing[2]).toEqual({
      id: "cleo",
      name: "Cleo Lopez",
      email: "cleo@inbeat.agency",
      color: "#157428",
      label: "0 of 3 clues",
    });
  });

  it("has nobody missing when everyone is ready", () => {
    expect(readiness([], [candidate("ana"), candidate("ben")])).toEqual({
      ready: 2,
      total: 2,
      missing: [],
    });
  });
});
