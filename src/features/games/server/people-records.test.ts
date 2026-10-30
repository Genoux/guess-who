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
  it("lists the signed-in people with team, card and mission, then the emails nobody signed in with", async () => {
    client.query
      .mockResolvedValueOnce({
        rows: [
          [
            "sam",
            "Sam Taylor",
            "sam@inbeat.agency",
            "Creative",
            "#46BDF0",
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
            "ana",
            "Ana Ferreira",
            "ana@inbeat.agency",
            null,
            null,
            null,
            null,
            true,
            "0",
            "game_1",
            "active",
            "ben",
            "2026-10-26",
            null,
            null,
            "Ben Carter",
          ],
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          [
            null,
            null,
            true,
            "kim@gmail.com",
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
        ask: "Night trains",
        imageUrl: "/demo/avatars/sam-taylor.webp",
        newHire: false,
        cluesWritten: 2,
        game: null,
      },
      {
        personId: "ana",
        signedIn: true,
        name: "Ana Ferreira",
        email: "ana@inbeat.agency",
        team: null,
        ask: null,
        imageUrl: null,
        newHire: true,
        cluesWritten: 0,
        game: {
          id: "game_1",
          status: "active",
          welcomerPersonId: "ben",
          welcomerName: "Ben Carter",
          startDate: "2026-10-26",
          foundAt: null,
          revealSeenAt: null,
        },
      },
      {
        personId: null,
        signedIn: false,
        name: null,
        email: "kim@gmail.com",
        team: null,
        ask: null,
        imageUrl: null,
        newHire: true,
        cluesWritten: null,
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

  it("reads people who signed in, with team and game, and games whose player has not", async () => {
    await listPeople();
    const [signedIn, invited] = sentStatements(client);
    expect(signedIn?.sql).toMatch(
      /from people left join teams on people\.team_id = teams\.id left join games on games\.player_person_id = people\.id left join people welcomer on games\.welcomer_person_id = welcomer\.id where people\.clerk_user_id is not null/,
    );
    expect(signedIn?.sql).toMatch(
      /from welcomer_clues where welcomer_clues\.person_id = people\.id/,
    );
    expect(invited?.sql).toMatch(
      /from games left join people player on games\.player_person_id = player\.id left join people welcomer on games\.welcomer_person_id = welcomer\.id where player\.clerk_user_id is null/,
    );
  });
});

describe("listWelcomerCandidates", () => {
  it("lists visible people with the clues they wrote, team or not", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        ["ana", "ana@inbeat.agency", false, "team_1", "Night trains", [2, 3, 4]],
        ["ben", "ben@inbeat.agency", false, null, null, []],
      ],
    });
    await expect(listWelcomerCandidates()).resolves.toEqual([
      {
        id: "ana",
        email: "ana@inbeat.agency",
        hidden: false,
        teamId: "team_1",
        ask: "Night trains",
        writtenClues: [2, 3, 4],
      },
      {
        id: "ben",
        email: "ben@inbeat.agency",
        hidden: false,
        teamId: null,
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
