import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { listGameActivity, listPeople, listWelcomerCandidates } from "./people-records";

const last = () => sentStatements(client).at(-1) ?? { sql: "", params: [] };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("listPeople", () => {
  it("lists everyone with team, card and mission, signed in or only invited", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        [
          "sam",
          "user_sam",
          "Sam Taylor",
          "sam@inbeat.agency",
          "Creative",
          "#46BDF0",
          "team_1",
          "Lisbon",
          "Rides night trains",
          "Night trains",
          "/demo/avatars/sam-taylor.webp",
          false,
          "2",
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        [
          "kim",
          null,
          "kim",
          "kim@gmail.com",
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          true,
          "0",
          "game_2",
          "active",
          "ben",
          "2026-10-27",
          null,
          null,
          "Ben Carter",
        ],
      ],
    });
    await expect(listPeople()).resolves.toEqual([
      {
        personId: "sam",
        signedIn: true,
        name: "Sam Taylor",
        email: "sam@inbeat.agency",
        team: { name: "Creative", color: "#46BDF0" },
        teamId: "team_1",
        location: "Lisbon",
        fact: "Rides night trains",
        ask: "Night trains",
        imageUrl: "/demo/avatars/sam-taylor.webp",
        newHire: false,
        cluesWritten: 2,
        game: null,
      },
      {
        personId: "kim",
        signedIn: false,
        name: "kim",
        email: "kim@gmail.com",
        team: null,
        teamId: null,
        location: null,
        fact: null,
        ask: null,
        imageUrl: null,
        newHire: true,
        cluesWritten: 0,
        game: {
          id: "game_2",
          status: "active",
          welcomerPersonId: "ben",
          welcomerName: "Ben Carter",
          startDate: "2026-10-27",
          foundAt: null,
          revealSeenAt: null,
        },
      },
    ]);
  });

  it("reads every person row, with a game linked by player or by email, in one query", async () => {
    await listPeople();
    expect(sentStatements(client)).toHaveLength(1);
    const [people] = sentStatements(client);
    expect(people?.sql).toMatch(
      /from people left join teams on people\.team_id = teams\.id left join games on \(games\.player_person_id = people\.id or games\.player_email = people\.email\) left join people welcomer on games\.welcomer_person_id = welcomer\.id$/,
    );
    expect(people?.sql).not.toMatch(/ where people\.|clerk_user_id is/);
    expect(people?.sql).toMatch(/from welcomer_clues where welcomer_clues\.person_id = people\.id/);
  });
});

describe("listWelcomerCandidates", () => {
  it("lists visible people with the clues they wrote, team or not", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        [
          "ana",
          "ana@inbeat.agency",
          false,
          "team_1",
          "Lisbon",
          "Rides trains",
          "Night trains",
          [2, 3, 4],
        ],
        ["ben", "ben@inbeat.agency", false, null, null, null, null, []],
      ],
    });
    await expect(listWelcomerCandidates()).resolves.toEqual([
      {
        id: "ana",
        email: "ana@inbeat.agency",
        hidden: false,
        teamId: "team_1",
        location: "Lisbon",
        fact: "Rides trains",
        ask: "Night trains",
        writtenClues: [2, 3, 4],
      },
      {
        id: "ben",
        email: "ben@inbeat.agency",
        hidden: false,
        teamId: null,
        location: null,
        fact: null,
        ask: null,
        writtenClues: [],
      },
    ]);
    expect(last().sql).toMatch(/from people where people\.hidden = \$1/);
    expect(last().sql).toMatch(
      /from welcomer_clues\s+where welcomer_clues\.person_id = people\.id/,
    );
  });
});

describe("listGameActivity", () => {
  it("counts stickers and takes the latest activity, per game, in one query", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        ["game_1", "12", "2026-10-27T15:00:00.000Z"],
        ["game_2", "0", null],
      ],
    });
    await expect(listGameActivity()).resolves.toEqual([
      {
        gameId: "game_1",
        collected: 12,
        lastActiveAt: new Date("2026-10-27T15:00:00.000Z"),
      },
      { gameId: "game_2", collected: 0, lastActiveAt: null },
    ]);
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(last().sql).toMatch(
      /from collections where collections\.collector_person_id = games\.player_person_id/,
    );
    expect(last().sql).toMatch(/greatest\(/);
  });
});
