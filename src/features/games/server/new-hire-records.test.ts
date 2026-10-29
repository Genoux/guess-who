import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { listGameActivity, listNewHireGames, listWelcomerCandidates } from "./new-hire-records";

const last = () => sentStatements(client).at(-1) ?? { sql: "", params: [] };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("listNewHireGames", () => {
  it("joins the player, the welcomer with their team color, and the creator", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        [
          "game_1",
          "sam@gmail.com",
          null,
          "2026-11-02",
          "active",
          null,
          "Sam Taylor",
          "Nita Rao",
          "Ana Ferreira",
          "ana",
          "#46BDF0",
          "Creative",
        ],
      ],
    });
    await expect(listNewHireGames()).resolves.toEqual([
      {
        id: "game_1",
        playerEmail: "sam@gmail.com",
        playerPersonId: null,
        startDate: "2026-11-02",
        status: "active",
        foundAt: null,
        playerName: "Sam Taylor",
        creatorName: "Nita Rao",
        welcomerName: "Ana Ferreira",
        welcomerPersonId: "ana",
        welcomerColor: "#46BDF0",
        welcomerTeam: "Creative",
      },
    ]);
    expect(last().sql).toMatch(
      /from games left join people player on games\.player_person_id = player\.id/,
    );
    expect(last().sql).toMatch(
      /inner join people welcomer on games\.welcomer_person_id = welcomer\.id/,
    );
    expect(last().sql).toMatch(/left join teams on welcomer\.team_id = teams\.id/);
    expect(last().sql).toMatch(/left join people creator on games\.created_by = creator\.id/);
  });
});

describe("listWelcomerCandidates", () => {
  it("lists visible people with their team and the clues they wrote, team or not", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        [
          "ana",
          "Ana Ferreira",
          "ana@inbeat.agency",
          false,
          "team_1",
          "Night trains",
          "Creative",
          "#46BDF0",
          [2, 3, 4],
        ],
        ["ben", "Ben Carter", "ben@inbeat.agency", false, null, null, null, null, []],
      ],
    });
    await expect(listWelcomerCandidates()).resolves.toEqual([
      {
        id: "ana",
        name: "Ana Ferreira",
        email: "ana@inbeat.agency",
        hidden: false,
        teamId: "team_1",
        ask: "Night trains",
        team: "Creative",
        color: "#46BDF0",
        writtenClues: [2, 3, 4],
      },
      {
        id: "ben",
        name: "Ben Carter",
        email: "ben@inbeat.agency",
        hidden: false,
        teamId: null,
        ask: null,
        team: null,
        color: null,
        writtenClues: [],
      },
    ]);
    expect(last().sql).toMatch(
      /left join teams on people\.team_id = teams\.id where people\.hidden = \$1/,
    );
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
    expect(last().sql).toMatch(/from collections where collections\.game_id = games\.id/);
    expect(last().sql).toMatch(/greatest\(/);
  });
});
