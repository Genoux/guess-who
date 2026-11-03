import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const begin = vi.hoisted(() => ({
  beginMissionRecord: vi.fn(),
  ALREADY_HAS_MISSION: "They already have a mission.",
}));
vi.mock("./begin-mission-record", () => begin);

import { NO_WELCOMER_FREE } from "./choose-welcomer";
import { startAsNewHireRecord } from "./start-as-new-hire-record";

const now = new Date("2026-11-02T15:00:00Z");
const input = { personId: "person_1", adminPersonId: "admin", now };
const noWelcomer = () =>
  new AppError("conflict", "no free welcomer", { safeMessage: NO_WELCOMER_FREE });

/** The person row first, then the games they play. */
const answer = ({
  person = [["sam@inbeat.agency", false]] as unknown[][],
  games = [] as unknown[][],
} = {}) => client.query.mockResolvedValueOnce({ rows: person }).mockResolvedValue({ rows: games });

const updates = () => sentStatements(client).filter(({ sql }) => sql.startsWith("update people"));
const flag = () => updates()[0];
const alreadyHasMission = () =>
  new AppError("conflict", "person already has a mission", {
    safeMessage: begin.ALREADY_HAS_MISSION,
  });

beforeEach(() => {
  client.query.mockReset();
  begin.beginMissionRecord.mockReset();
  begin.beginMissionRecord.mockResolvedValue({ gameId: "game_1" });
  answer();
});

describe("startAsNewHireRecord", () => {
  it("flags the person and starts their mission now, with the admin as creator", async () => {
    await expect(startAsNewHireRecord(input)).resolves.toEqual({ started: true });
    expect(flag()?.sql).toMatch(/^update people set new_hire = \$1.* where people\.id = \$\d+/);
    expect(flag()?.params).toEqual(expect.arrayContaining([true, "person_1"]));
    expect(begin.beginMissionRecord).toHaveBeenCalledWith({
      playerEmail: "sam@inbeat.agency",
      playerPersonId: "person_1",
      createdBy: "admin",
      now,
    });
  });

  it("starts with no creator when no admin is given", async () => {
    await startAsNewHireRecord({ ...input, adminPersonId: null });
    expect(begin.beginMissionRecord).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: null }),
    );
  });

  it("flags before it starts, so a person with no free welcomer stays flagged", async () => {
    begin.beginMissionRecord.mockRejectedValueOnce(noWelcomer());
    await expect(startAsNewHireRecord(input)).resolves.toEqual({ started: false });
    expect(flag()).toBeDefined();
  });

  it("clears the flag it set when a concurrent start gave the person a mission first", async () => {
    begin.beginMissionRecord.mockRejectedValueOnce(alreadyHasMission());
    await expect(startAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
    expect(updates()).toHaveLength(2);
    expect(updates()[1]?.params).toEqual(expect.arrayContaining([false, "person_1"]));
  });

  it("undoes the flag only while the person has no game, decided in SQL", async () => {
    begin.beginMissionRecord.mockRejectedValueOnce(alreadyHasMission());
    await expect(startAsNewHireRecord(input)).rejects.toThrow();
    const undo = updates()[1];
    expect(undo?.sql).toMatch(
      /where \(people\.id = \$\d+ and not exists \(select .* from games where games\.player_person_id = people\.id\)\)/,
    );
  });

  it("keeps a flag that was already there when a concurrent start won", async () => {
    client.query.mockReset();
    answer({ person: [["sam@inbeat.agency", true]] });
    begin.beginMissionRecord.mockRejectedValueOnce(alreadyHasMission());
    await expect(startAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
    expect(updates()).toHaveLength(1);
  });

  it("lets any other failure through", async () => {
    begin.beginMissionRecord.mockRejectedValueOnce(new Error("db down"));
    await expect(startAsNewHireRecord(input)).rejects.toThrow("db down");
  });

  it.each(["active", "found", "revealed"])(
    "refuses someone who already has a %s mission, and does not flag them",
    async (status) => {
      client.query.mockReset();
      answer({ games: [[status]] });
      await expect(startAsNewHireRecord(input)).rejects.toSatisfy(
        (err) => isAppError(err, "conflict") && err.safeMessage === begin.ALREADY_HAS_MISSION,
      );
      expect(flag()).toBeUndefined();
      expect(begin.beginMissionRecord).not.toHaveBeenCalled();
    },
  );

  it("looks their games up by person id only", async () => {
    await startAsNewHireRecord(input);
    const games = sentStatements(client).find(({ sql }) => sql.includes("from games"));
    expect(games?.sql).toMatch(/where games\.player_person_id = \$1/);
    expect(games?.sql).not.toMatch(/player_email/);
  });

  it("answers not found for an unknown person", async () => {
    client.query.mockReset();
    answer({ person: [] });
    await expect(startAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
  });
});
