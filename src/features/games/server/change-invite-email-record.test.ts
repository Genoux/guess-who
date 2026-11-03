import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ findGameById: vi.fn() }));
vi.mock("./game-records", () => records);

const people = vi.hoisted(() => ({ findPersonByEmail: vi.fn() }));
vi.mock("@/shared/lib/person-records", () => people);

import { changeInviteEmailRecord } from "./change-invite-email-record";

const unsigned = {
  id: "game_1",
  status: "active",
  playerPersonId: null,
  playerEmail: "kim.old@gmail.com",
  welcomerPersonId: "ben",
};
const failsWith = (kind: "forbidden" | "not_found" | "conflict") =>
  expect.toSatisfy((err) => isAppError(err, kind));
const update = () => sentStatements(client).find(({ sql }) => sql.startsWith("update games"));

/** The mutual-welcoming read finds a game only when `mutual`; every write answers one row. */
const behave = ({ mutual = false } = {}) =>
  client.query.mockImplementation(async (config) => {
    const text = config.text.replaceAll('"', "");
    return {
      rows:
        text.startsWith("select") && text.includes("from games")
          ? mutual
            ? [["game_9"]]
            : []
          : [["game_1"]],
    };
  });

beforeEach(() => {
  client.query.mockReset();
  behave();
  records.findGameById.mockResolvedValue(unsigned);
  people.findPersonByEmail.mockResolvedValue(undefined);
});

const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

describe("changeInviteEmailRecord", () => {
  it("moves the pre-created person row to the new email, with the placeholder name", async () => {
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    const row = statement("update people");
    expect(row?.sql).toMatch(
      /set email = \$1, name = case when people\.name = \$2 then \$3 else people\.name end/,
    );
    expect(row?.sql).toMatch(/where \(people\.email = \$\d+ and people\.clerk_user_id is null\)/);
    expect(row?.params).toEqual(
      expect.arrayContaining(["kim@gmail.com", "kim.old", "kim", "kim.old@gmail.com"]),
    );
  });

  it("when the new email already has a person, drops the placeholder row and flags that person", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "kim", clerkUserId: null });
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    const sql = sentStatements(client).map(({ sql }) => sql);
    expect(sql.some((text) => text.startsWith("delete from people"))).toBe(true);
    expect(sql.some((text) => /^update people set new_hire/.test(text))).toBe(true);
    expect(sql.some((text) => /^update people set email/.test(text))).toBe(false);
  });

  it("fixes the email of a mission nobody has signed in to", async () => {
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    expect(update()?.params).toEqual(expect.arrayContaining(["kim@gmail.com", "game_1"]));
  });

  it("links the mission when the fixed email already signed in", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "kim", clerkUserId: "user_kim" });
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    expect(update()?.params).toContain("kim");
  });

  it("refuses to make the mission's own welcomer its player", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "ben", clerkUserId: "user_ben" });
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "ben@inbeat.agency" }),
    ).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") && err.safeMessage === "They're this mission's welcomer.",
    );
    expect(update()).toBeUndefined();
  });

  it("refuses a player who already welcomes the mission's welcomer: no two people welcome each other", async () => {
    behave({ mutual: true });
    people.findPersonByEmail.mockResolvedValue({ id: "kim", clerkUserId: "user_kim" });
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" }),
    ).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") &&
        err.safeMessage === "They already welcome this mission's welcomer.",
    );
    expect(update()).toBeUndefined();
    expect(sentStatements(client).some(({ sql }) => sql.startsWith("delete from people"))).toBe(
      false,
    );
  });

  it("checks that inside the transaction, behind the start lock, before any write", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "kim", clerkUserId: "user_kim" });
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    const sql = sentStatements(client).map((statement) => statement.sql);
    const lock = sql.findIndex((text) => text.includes("pg_advisory_xact_lock"));
    const check = sql.findIndex((text) => text.startsWith("select") && text.includes("from games"));
    const write = sql.findIndex((text) => text.startsWith("delete from people"));
    expect(lock).toBeGreaterThan(0);
    expect(lock).toBeLessThan(check);
    expect(check).toBeLessThan(write);
  });

  it("does not check a brand-new email: nobody has a mission or a welcomer yet", async () => {
    await changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" });
    expect(sentStatements(client).some(({ sql }) => sql.includes("pg_advisory"))).toBe(false);
  });

  it("refuses once the player signed in", async () => {
    records.findGameById.mockResolvedValue({ ...unsigned, playerPersonId: "kim" });
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" }),
    ).rejects.toThrow(failsWith("forbidden"));
    expect(update()).toBeUndefined();
  });

  it("answers not found for an unknown game", async () => {
    records.findGameById.mockResolvedValue(undefined);
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" }),
    ).rejects.toThrow(failsWith("not_found"));
  });

  it("refuses when the player signed in between the read and the write", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" }),
    ).rejects.toThrow(failsWith("forbidden"));
  });

  it("turns an email that already has a mission into a conflict", async () => {
    client.query.mockRejectedValue(Object.assign(new Error("duplicate"), { code: "23505" }));
    await expect(
      changeInviteEmailRecord({ gameId: "game_1", email: "kim@gmail.com" }),
    ).rejects.toThrow(failsWith("conflict"));
  });
});
