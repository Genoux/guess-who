import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { addNewHireRecord } from "./add-new-hire-record";

const input = { email: "sam@gmail.com" };
const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("addNewHireRecord", () => {
  it("creates the person with the new hire flag, named after the email until they sign in", async () => {
    await addNewHireRecord(input);
    const person = statement("insert into people");
    expect(person?.sql).toMatch(/on conflict \(email\) do update set new_hire = \$\d+/);
    expect(person?.params).toEqual(expect.arrayContaining(["sam@gmail.com", "sam", true]));
  });

  it("starts no mission: it never writes a game", async () => {
    await addNewHireRecord(input);
    expect(sentStatements(client).some(({ sql }) => /into (games|clues)/.test(sql))).toBe(false);
  });

  it("needs no card or clues", async () => {
    await addNewHireRecord(input);
    const sql = sentStatements(client)
      .map((s) => s.sql)
      .join(" ");
    expect(sql).not.toMatch(/welcomer_clues/);
  });

  it("refuses an email that already has a mission and writes nothing", async () => {
    client.query.mockResolvedValueOnce({ rows: [["game_1"]] });
    await expect(addNewHireRecord(input)).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") && err.safeMessage === "This email already has a mission.",
    );
    expect(statement("insert")).toBeUndefined();
  });
});
