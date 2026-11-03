import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RosterPerson } from "@/integrations/deel/to-roster-change";
import { fakeDbModule, sentStatements } from "@/test/fake-db";
import { upsertRosterPersonRecord } from "./upsert-roster-person-record";

const client = { query: vi.fn() };
let holders: unknown[][] = [];

const person: RosterPerson = {
  deelId: "deel-1",
  name: "Sam Seed",
  team: "Creative",
  location: "Canada",
  email: "sam@work.example",
  personalEmail: "sam@gmail.example",
  startDate: "2026-01-05",
};

const upsert = async (input: RosterPerson = person) => {
  const { db } = await fakeDbModule(client);
  return upsertRosterPersonRecord(db, input);
};

const writes = () => sentStatements(client).filter(({ sql }) => /^(insert|update) /.test(sql));

beforeEach(() => {
  holders = [];
  client.query.mockReset();
  client.query.mockImplementation(async (config: { text: string }) => {
    if (config.text.includes('from "people"')) return { rows: holders };
    if (config.text.includes('from "teams"')) return { rows: [["team_creative"]] };
    return { rows: [] };
  });
});

describe("upsertRosterPersonRecord", () => {
  it("creates a person with the Deel fields and the team id", async () => {
    await expect(upsert()).resolves.toBe("created");
    const [insert] = writes();
    expect(insert?.sql).toMatch(/^insert into people/);
    expect(insert?.params).toEqual(
      expect.arrayContaining([
        "deel-1",
        "Sam Seed",
        "team_creative",
        "Canada",
        "sam@work.example",
        "sam@gmail.example",
        "2026-01-05",
      ]),
    );
  });

  it("updates the person with that deel id and writes only Deel-owned columns", async () => {
    holders = [["person_1", "deel-1", "sam@work.example"]];
    await expect(upsert()).resolves.toBe("updated");
    const [update] = writes();
    expect(update?.sql).toMatch(/^update people set /);
    expect(update?.sql).not.toMatch(
      /fact|ask|new_hire|auto_mission_done_at|clerk_user_id|image_url/,
    );
    expect(update?.params).toContain("person_1");
  });

  it("is idempotent: the same input twice sends the same write", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    holders = [["person_1", "deel-1", "sam@work.example"]];
    await upsert();
    await upsert();
    const [first, second] = writes();
    vi.useRealTimers();
    expect(second).toEqual(first);
  });

  it("keeps the team and location on update when Deel has none", async () => {
    holders = [["person_1", "deel-1", "sam@work.example"]];
    await upsert({ ...person, team: null, location: null });
    expect(writes()[0]?.sql).not.toMatch(/team_id|location/);
    expect(sentStatements(client).some(({ sql }) => sql.includes("from teams"))).toBe(false);
  });

  it("writes a null team and location on insert", async () => {
    await upsert({ ...person, team: null, location: null });
    expect(writes()[0]?.sql).toMatch(/^insert into people/);
  });

  it("adopts the one person with that email who has no deel id yet", async () => {
    holders = [["person_9", null, "sam@work.example"]];
    await expect(upsert()).resolves.toBe("updated");
    expect(writes()[0]?.params).toContain("person_9");
  });

  it.each([
    ["the work email is another person's", [["person_2", "deel-2", "sam@work.example"]]],
    [
      "the personal email is another person's",
      [
        ["person_1", "deel-1"],
        ["person_2", "deel-2"],
      ],
    ],
    [
      "two people without a deel id hold the emails",
      [
        ["person_8", null],
        ["person_9", null],
      ],
    ],
    [
      "a null-deel-id row matches only by its email being our personal email",
      [["person_7", null, "sam@gmail.example"]],
    ],
  ])("rejects the write when %s and changes nothing", async (_label, rows) => {
    holders = rows;
    await expect(upsert()).resolves.toBe("conflict");
    expect(writes()).toEqual([]);
  });
});
