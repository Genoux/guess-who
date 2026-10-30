import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const add = vi.hoisted(() => ({ addNewHireRecord: vi.fn() }));
vi.mock("./add-new-hire-record", () => add);

import { setAsNewHireRecord } from "./set-as-new-hire-record";

const now = new Date("2026-11-02T15:00:00Z");
const input = { personId: "person_1", adminPersonId: "admin", now, startMission: true };

/** The person row first, then the statuses of their games. */
const answer = ({
  person = [["sam@inbeat.agency", "user_sam"]] as unknown[][],
  played = [] as unknown[][],
} = {}) => client.query.mockResolvedValueOnce({ rows: person }).mockResolvedValue({ rows: played });

beforeEach(() => {
  client.query.mockReset();
  answer();
  add.addNewHireRecord.mockReset();
  add.addNewHireRecord.mockResolvedValue({ gameId: "game_1" });
});

describe("setAsNewHireRecord", () => {
  it("turns someone who signed in into a new hire the same way adding them by email does", async () => {
    await expect(setAsNewHireRecord(input)).resolves.toEqual({ gameId: "game_1" });
    expect(add.addNewHireRecord).toHaveBeenCalledWith({
      email: "sam@inbeat.agency",
      adminPersonId: "admin",
      now,
    });
  });

  it("flags them without a mission when the admin says not yet, and creates no game", async () => {
    await expect(setAsNewHireRecord({ ...input, startMission: false })).resolves.toEqual({
      gameId: null,
    });
    expect(add.addNewHireRecord).not.toHaveBeenCalled();
    const flag = sentStatements(client).find(({ sql }) => sql.startsWith("update people"));
    expect(flag?.sql).toMatch(/^update people set new_hire = \$1.* where people\.id = \$\d+/);
    expect(flag?.params).toEqual(expect.arrayContaining([true, "person_1"]));
    expect(sentStatements(client).some(({ sql }) => sql.includes("insert"))).toBe(false);
  });

  it("asks for no card and no clues: it only reads the person and their games", async () => {
    await setAsNewHireRecord(input);
    const sql = sentStatements(client).map((statement) => statement.sql);
    expect(sql).toHaveLength(2);
    expect(sql[0]).toMatch(/^select .* from people where people\.id = \$1/);
    expect(sql[1]).toMatch(/^select .* from games where/);
    expect(sql.join(" ")).not.toMatch(/welcomer_clues|team_id|ask/);
  });

  it.each(["found", "revealed"])(
    "refuses someone whose mission is %s: a finished player is never locked again",
    async (status) => {
      client.query.mockReset();
      answer({ played: [[status]] });
      await expect(setAsNewHireRecord(input)).rejects.toSatisfy(
        (err) => isAppError(err, "conflict") && err.safeMessage === "They've already played.",
      );
      expect(add.addNewHireRecord).not.toHaveBeenCalled();
    },
  );

  it("refuses to flag someone who already played, too", async () => {
    client.query.mockReset();
    answer({ played: [["revealed"]] });
    await expect(setAsNewHireRecord({ ...input, startMission: false })).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
    expect(sentStatements(client).some(({ sql }) => sql.startsWith("update people"))).toBe(false);
  });

  it("lets someone with a running mission through", async () => {
    client.query.mockReset();
    answer({ played: [["active"]] });
    await expect(setAsNewHireRecord({ ...input, startMission: false })).resolves.toEqual({
      gameId: null,
    });
  });

  it("answers not found for an unknown person", async () => {
    client.query.mockReset();
    answer({ person: [] });
    await expect(setAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
    expect(add.addNewHireRecord).not.toHaveBeenCalled();
  });

  it("refuses someone who has not signed in: they are added by email instead", async () => {
    client.query.mockReset();
    answer({ person: [["sam@inbeat.agency", null]] });
    await expect(setAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
    expect(add.addNewHireRecord).not.toHaveBeenCalled();
  });

  it("refuses to flag someone who has not signed in either", async () => {
    client.query.mockReset();
    answer({ person: [["sam@inbeat.agency", null]] });
    await expect(setAsNewHireRecord({ ...input, startMission: false })).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
  });
});
