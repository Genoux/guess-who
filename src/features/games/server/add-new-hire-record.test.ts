import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const begin = vi.hoisted(() => ({ beginMissionRecord: vi.fn() }));
vi.mock("./begin-mission-record", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./begin-mission-record")>()),
  ...begin,
}));

import { addNewHireRecord } from "./add-new-hire-record";
import { NO_WELCOMER_FREE } from "./choose-welcomer";

const now = new Date("2026-11-02T15:00:00Z");
const input = { email: "sam@gmail.com", adminPersonId: "admin", now };
const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  client.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [["person_1"]] });
  begin.beginMissionRecord.mockReset();
  begin.beginMissionRecord.mockResolvedValue({ gameId: "game_1" });
});

describe("addNewHireRecord", () => {
  it("creates the person with the new hire flag, named after the email until they sign in", async () => {
    await addNewHireRecord(input);
    const person = statement("insert into people");
    expect(person?.sql).toMatch(/on conflict \(email\) do update set new_hire = \$\d+/);
    expect(person?.params).toEqual(expect.arrayContaining(["sam@gmail.com", "sam", true]));
  });

  it("starts their mission today through the shared path, with the admin as creator", async () => {
    await expect(addNewHireRecord(input)).resolves.toEqual({ started: true });
    expect(begin.beginMissionRecord).toHaveBeenCalledWith({
      playerEmail: "sam@gmail.com",
      playerPersonId: "person_1",
      createdBy: "admin",
      now,
    });
  });

  it("keeps the person flagged when no welcomer is free, and reports it did not start", async () => {
    begin.beginMissionRecord.mockRejectedValue(
      new AppError("conflict", "no free welcomer", { safeMessage: NO_WELCOMER_FREE }),
    );
    await expect(addNewHireRecord(input)).resolves.toEqual({ started: false });
    expect(statement("insert into people")).toBeDefined();
  });

  it("lets any other failure through", async () => {
    begin.beginMissionRecord.mockRejectedValue(new Error("boom"));
    await expect(addNewHireRecord(input)).rejects.toThrow("boom");
  });

  it("needs no card or clues", async () => {
    await addNewHireRecord(input);
    const sql = sentStatements(client)
      .map((s) => s.sql)
      .join(" ");
    expect(sql).not.toMatch(/welcomer_clues/);
  });

  it("refuses an email that already has a mission and writes nothing", async () => {
    client.query.mockReset();
    client.query.mockResolvedValueOnce({ rows: [["game_1"]] });
    await expect(addNewHireRecord(input)).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") && err.safeMessage === "This email already has a mission.",
    );
    expect(statement("insert")).toBeUndefined();
    expect(begin.beginMissionRecord).not.toHaveBeenCalled();
  });
});
