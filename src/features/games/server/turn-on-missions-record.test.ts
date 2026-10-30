import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const begin = vi.hoisted(() => ({ beginMissionRecord: vi.fn() }));
vi.mock("./begin-mission-record", () => begin);

import { AppError } from "@inbeat/core/errors";
import { NO_WELCOMER_FREE } from "./choose-welcomer";
import { turnOnMissionsRecord } from "./turn-on-missions-record";

const now = new Date("2026-11-02T15:00:00Z");
const turnOn = (personIds: string[]) =>
  turnOnMissionsRecord({ personIds, adminPersonId: "admin", now });
const noWelcomer = () =>
  new AppError("conflict", "no free welcomer", { safeMessage: NO_WELCOMER_FREE });

const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

beforeEach(() => {
  client.query.mockReset();
  begin.beginMissionRecord.mockReset();
  begin.beginMissionRecord.mockResolvedValue({ gameId: "game_1" });
});

describe("turnOnMissionsRecord", () => {
  it("reads only the chosen people who signed in, have no mission, and can welcome", async () => {
    client.query.mockResolvedValueOnce({ rows: [] });
    await turnOn(["ana", "ben"]);
    const select = statement("select");
    expect(select?.sql).toMatch(
      /where \(people\.id in \(\$1, \$2\) and people\.clerk_user_id is not null and /,
    );
    expect(select?.sql).toMatch(
      /games\.player_person_id = people\.id or games\.player_email = people\.email/,
    );
    expect(select?.params).toEqual(expect.arrayContaining(["ana", "ben"]));
  });

  it("skips anyone whose card is unfinished or who has fewer than three clues, in the query", async () => {
    client.query.mockResolvedValueOnce({ rows: [] });
    await turnOn(["ana"]);
    const sql = statement("select")?.sql ?? "";
    expect(sql).toMatch(/people\.team_id is not null/);
    expect(sql).toMatch(/btrim\(coalesce\(people\.ask, ''\)\) <> ''/);
    expect(sql).toMatch(
      /from welcomer_clues where welcomer_clues\.person_id = people\.id and btrim\(welcomer_clues\.text\) <> ''\) = \$\d+/,
    );
  });

  it("lets a new hire through with no card and no clues: the readiness gate is for teammates", async () => {
    client.query.mockResolvedValueOnce({ rows: [] });
    await turnOn(["ana"]);
    const select = statement("select");
    expect(select?.sql).toMatch(/\(people\.new_hire = \$\d+ or \(people\.team_id is not null/);
    expect(select?.params).toContain(true);
  });

  it("starts nothing when everyone already has a mission", async () => {
    client.query.mockResolvedValueOnce({ rows: [] });
    await expect(turnOn(["ana"])).resolves.toEqual({ started: 0, skippedNoWelcomer: 0 });
    expect(begin.beginMissionRecord).not.toHaveBeenCalled();
  });

  it("starts each person's mission one by one, with the admin as creator", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        ["ana", "ana@inbeat.agency"],
        ["ben", "ben@inbeat.agency"],
      ],
    });
    await expect(turnOn(["ana", "ben"])).resolves.toEqual({ started: 2, skippedNoWelcomer: 0 });
    expect(begin.beginMissionRecord.mock.calls.map(([input]) => input)).toEqual([
      { playerEmail: "ana@inbeat.agency", playerPersonId: "ana", createdBy: "admin", now },
      { playerEmail: "ben@inbeat.agency", playerPersonId: "ben", createdBy: "admin", now },
    ]);
  });

  it("skips and counts whoever finds no free welcomer, and starts the rest", async () => {
    client.query.mockResolvedValueOnce({
      rows: [
        ["ana", "ana@inbeat.agency"],
        ["ben", "ben@inbeat.agency"],
        ["cam", "cam@inbeat.agency"],
      ],
    });
    begin.beginMissionRecord
      .mockResolvedValueOnce({ gameId: "game_1" })
      .mockRejectedValueOnce(noWelcomer())
      .mockRejectedValueOnce(noWelcomer());
    await expect(turnOn(["ana", "ben", "cam"])).resolves.toEqual({
      started: 1,
      skippedNoWelcomer: 2,
    });
  });

  it("lets any other failure through", async () => {
    client.query.mockResolvedValueOnce({ rows: [["ana", "ana@inbeat.agency"]] });
    begin.beginMissionRecord.mockRejectedValueOnce(new Error("db down"));
    await expect(turnOn(["ana"])).rejects.toThrow("db down");
  });
});
