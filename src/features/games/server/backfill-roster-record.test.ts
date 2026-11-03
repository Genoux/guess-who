import { beforeEach, describe, expect, it, vi } from "vitest";
import { type DeelPerson, deelPersonSchema } from "@/integrations/deel/deel-person";
import { fakeDbModule, sentStatements } from "@/test/fake-db";
import { assertBackfillTarget, backfillRosterRecord } from "./backfill-roster-record";

const PRODUCTION_DB = "postgresql://u:p@ep-wandering-truth-a1-pooler.us-east-1.aws.neon.tech/album";
const DEV_DB = "postgresql://u:p@ep-small-dew-a1-pooler.us-east-1.aws.neon.tech/album";
const PRODUCTION_DEEL = "https://api.letsdeel.com/rest/v2";
const SANDBOX_DEEL = "https://api-sandbox.demo.deel.com/rest/v2";

const target = (overrides: Partial<Parameters<typeof assertBackfillTarget>[0]> = {}) => ({
  databaseUrl: PRODUCTION_DB,
  deelApiUrl: PRODUCTION_DEEL,
  apply: false,
  confirmProduction: false,
  ...overrides,
});

describe("assertBackfillTarget", () => {
  it("allows a dry run on production", () => {
    expect(() => assertBackfillTarget(target())).not.toThrow();
  });

  it("requires the production confirmation to apply on production", () => {
    expect(() => assertBackfillTarget(target({ apply: true }))).toThrow(/--confirm-production/);
    expect(() =>
      assertBackfillTarget(target({ apply: true, confirmProduction: true })),
    ).not.toThrow();
  });

  it("refuses real Deel people on a non-production database", () => {
    expect(() => assertBackfillTarget(target({ databaseUrl: DEV_DB }))).toThrow(/mismatch/);
  });

  it("refuses sandbox Deel people on the production database", () => {
    expect(() => assertBackfillTarget(target({ deelApiUrl: SANDBOX_DEEL }))).toThrow(/mismatch/);
  });

  it("allows a rehearsal with sandbox Deel on a dev database, no confirmation needed", () => {
    expect(() =>
      assertBackfillTarget(target({ databaseUrl: DEV_DB, deelApiUrl: SANDBOX_DEEL, apply: true })),
    ).not.toThrow();
  });

  it("refuses a missing database url", () => {
    expect(() => assertBackfillTarget(target({ databaseUrl: undefined }))).toThrow(/DATABASE_URL/);
  });
});

const client = { query: vi.fn() };
const NOW = new Date("2026-11-03T12:00:00Z");

const deelPerson = (id: string, overrides: Record<string, unknown> = {}): DeelPerson =>
  deelPersonSchema.parse({
    id,
    first_name: "Sam",
    last_name: id,
    emails: [{ type: "work", value: `${id}@work.example` }],
    hiring_status: "active",
    country: "CA",
    department: { id: "d", name: "Design (IB)" },
    client_legal_entity: { id: "e", name: "9434-1641 QUEBEC INC." },
    ...overrides,
  });

const run = async (roster: DeelPerson[], apply: boolean) => {
  const { db } = await fakeDbModule(client);
  return backfillRosterRecord({ database: db, people: roster, apply, now: NOW });
};
const statements = () => sentStatements(client).map(({ sql }) => sql);

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("backfillRosterRecord", () => {
  const roster = [
    deelPerson("a"),
    deelPerson("b"),
    deelPerson("gone", { hiring_status: "inactive" }),
    deelPerson("other", { client_legal_entity: { id: "x", name: "Other Corp" } }),
    deelPerson("mail", { emails: [] }),
  ];

  it("counts creates and skips by reason, with no names or emails", async () => {
    const counts = await run(roster, false);
    expect(counts).toEqual({
      created: 2,
      updated: 0,
      conflict: 0,
      skipped: { "not active or leaver": 1, "out of scope": 1, "no email": 1 },
    });
    expect(JSON.stringify(counts)).not.toMatch(/Sam|@/);
  });

  it("seeds the teams before writing people", async () => {
    await run(roster, true);
    const sql = statements();
    expect(sql.findIndex((s) => s.startsWith("insert into teams"))).toBeLessThan(
      sql.findIndex((s) => s.startsWith("insert into people")),
    );
  });

  it("rolls everything back on a dry run", async () => {
    await run(roster, false);
    expect(statements()).toContain("rollback");
    expect(statements()).not.toContain("commit");
  });

  it("commits on apply and marks the written people so they never auto-start", async () => {
    await run(roster, true);
    expect(statements()).toContain("commit");
    const marker = sentStatements(client).find(({ sql }) =>
      sql.startsWith("update people set auto_mission_done_at"),
    );
    expect(marker?.sql).toMatch(/auto_mission_done_at is null/);
    expect(marker?.params).toEqual(expect.arrayContaining(["a", "b"]));
    expect(marker?.params).not.toContain("gone");
  });

  it("marks nobody when nobody is written", async () => {
    await run([deelPerson("gone", { hiring_status: "inactive" })], true);
    expect(statements().some((s) => s.startsWith("update people set auto_mission_done_at"))).toBe(
      false,
    );
  });

  it("counts an email held by another person as a conflict and does not mark it", async () => {
    client.query.mockImplementation(async (config: { text: string }) => ({
      rows: config.text.includes('from "people"') ? [["person_2", "deel-2"]] : [],
    }));
    const counts = await run([deelPerson("a")], true);
    expect(counts).toMatchObject({ created: 0, conflict: 1 });
    expect(statements().some((s) => s.startsWith("update people set auto_mission_done_at"))).toBe(
      false,
    );
  });
});
