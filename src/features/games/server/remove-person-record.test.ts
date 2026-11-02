import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ revealExpiredGames: vi.fn(async () => 0) }));
vi.mock("./game-records", () => records);

import { removePersonRecord } from "./remove-person-record";

const now = new Date("2026-10-28T15:00:00Z");
const input = { personId: "kim", actorPersonId: "admin", now };
const failsWith = (kind: "forbidden" | "not_found" | "conflict") =>
  expect.toSatisfy((err) => isAppError(err, kind));
const statement = (verb: string) => sentStatements(client).find(({ sql }) => sql.startsWith(verb));

/** The person row exists unless `missing`; a running game involves them only when `running`. */
const behave = ({ missing = false, running = false } = {}) =>
  client.query.mockImplementation(async (config) => {
    const text = config.text.replaceAll('"', "");
    if (text.startsWith("select") && text.includes("from people")) {
      return { rows: missing ? [] : [["kim@gmail.com"]] };
    }
    if (text.startsWith("select") && text.includes("from games")) {
      return { rows: running ? [["game_1"]] : [] };
    }
    return { rows: [] };
  });

beforeEach(() => {
  client.query.mockReset();
  records.revealExpiredGames.mockClear();
  behave();
});

describe("removePersonRecord", () => {
  it("deletes the games they played or welcomed, then the person, in that order", async () => {
    await removePersonRecord(input);
    const deletes = sentStatements(client).filter(({ sql }) => sql.startsWith("delete from"));
    expect(deletes.map(({ sql }) => sql.split(" where")[0])).toEqual([
      "delete from games",
      "delete from people",
    ]);
    expect(statement("delete from games")?.sql).toMatch(
      /player_person_id = \$\d+ or .*welcomer_person_id = \$\d+ or .*player_person_id is null and .*player_email = \$\d+/,
    );
    expect(statement("delete from people")?.params).toEqual(["kim"]);
  });

  it("frees missions past day 14 first, so a lapsed welcomer can be removed", async () => {
    await removePersonRecord(input);
    expect(records.revealExpiredGames).toHaveBeenCalledWith(now);
  });

  it("refuses while a mission they play or welcome is running, and deletes nothing", async () => {
    behave({ running: true });
    await expect(removePersonRecord(input)).rejects.toSatisfy(
      (err) => isAppError(err, "conflict") && err.safeMessage === "End their mission first.",
    );
    expect(statement("delete from")).toBeUndefined();
  });

  it("refuses an admin removing themselves before touching anything", async () => {
    await expect(removePersonRecord({ ...input, actorPersonId: "kim" })).rejects.toThrow(
      failsWith("forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("answers not found for an unknown person", async () => {
    behave({ missing: true });
    await expect(removePersonRecord(input)).rejects.toThrow(failsWith("not_found"));
    expect(statement("delete from")).toBeUndefined();
  });
});
