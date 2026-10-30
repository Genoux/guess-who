import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const begin = vi.hoisted(() => ({ beginMissionRecord: vi.fn() }));
vi.mock("./begin-mission-record", () => begin);

import { db } from "@/shared/lib/db";
import { addNewHireRecord } from "./add-new-hire-record";

const now = new Date("2026-11-02T15:00:00Z");
const input = { email: "sam@gmail.com", adminPersonId: "admin", now };
const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

/** The people lookup finds `existing`; the upsert answers with the row's id and Clerk id. */
const answer = ({ existing, upserted }: { existing: unknown[][]; upserted: unknown[] }) =>
  client.query.mockImplementation(async ({ text }: { text: string }) => ({
    rows: text.startsWith("insert") ? [upserted] : existing,
  }));

/** The start runs the caller's step in a real (fake-db) transaction, as the record does. */
const startRuns = () =>
  begin.beginMissionRecord.mockImplementation(async ({ prepare }) => ({
    gameId: "game_1",
    linkedPersonId: await db.transaction((tx) => prepare(tx)),
  }));

beforeEach(() => {
  client.query.mockReset();
  begin.beginMissionRecord.mockReset();
  answer({ existing: [], upserted: ["person_1", null] });
  startRuns();
});

describe("addNewHireRecord", () => {
  it("starts the mission for the email, with the admin as creator", async () => {
    await expect(addNewHireRecord(input)).resolves.toMatchObject({ gameId: "game_1" });
    expect(begin.beginMissionRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        playerEmail: "sam@gmail.com",
        playerPersonId: null,
        createdBy: "admin",
        now,
      }),
    );
  });

  it("picks for the person who already has a row, so they are never their own welcomer", async () => {
    answer({ existing: [["person_7"]], upserted: ["person_7", "user_sam"] });
    await addNewHireRecord(input);
    expect(begin.beginMissionRecord).toHaveBeenCalledWith(
      expect.objectContaining({ playerPersonId: "person_7" }),
    );
  });

  it("pre-creates the person with the new hire flag inside the start, so a refused start leaves no flag", async () => {
    await addNewHireRecord(input);
    const person = statement("insert into people");
    expect(person?.sql).toMatch(/on conflict \(email\) do update set new_hire = \$\d+/);
    expect(person?.params).toEqual(expect.arrayContaining(["sam@gmail.com", "sam", true]));
    const sql = sentStatements(client).map((s) => s.sql.trim());
    expect(sql.indexOf("begin")).toBeLessThan(sql.findIndex((text) => text.startsWith("insert")));
  });

  it("leaves the game unlinked until they sign in, then the sign-in links it by email", async () => {
    await expect(addNewHireRecord(input)).resolves.toMatchObject({ linkedPersonId: null });
  });

  it("links someone who already signed in to their person", async () => {
    answer({ existing: [["person_1"]], upserted: ["person_1", "user_sam"] });
    await expect(addNewHireRecord(input)).resolves.toMatchObject({ linkedPersonId: "person_1" });
  });

  it("needs no card or clues: a new hire's mission comes first, whoever they are", async () => {
    await addNewHireRecord(input);
    expect(
      sentStatements(client)
        .map(({ sql }) => sql)
        .join(" "),
    ).not.toMatch(/welcomer_clues/);
  });
});
