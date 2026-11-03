import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { setAsNewHireRecord } from "./set-as-new-hire-record";

const input = { personId: "person_1" };

/** The person row first, then the statuses of their games. */
const answer = ({
  person = [["sam@inbeat.agency"]] as unknown[][],
  played = [] as unknown[][],
} = {}) => client.query.mockResolvedValueOnce({ rows: person }).mockResolvedValue({ rows: played });

beforeEach(() => {
  client.query.mockReset();
  answer();
});

describe("setAsNewHireRecord", () => {
  it("flags the person as a new hire and creates no game", async () => {
    await setAsNewHireRecord(input);
    const flag = sentStatements(client).find(({ sql }) => sql.startsWith("update people"));
    expect(flag?.sql).toMatch(/^update people set new_hire = \$1.* where people\.id = \$\d+/);
    expect(flag?.params).toEqual(expect.arrayContaining([true, "person_1"]));
    expect(sentStatements(client).some(({ sql }) => sql.includes("insert"))).toBe(false);
  });

  it("asks for no card, no clues and no sign-in: it only reads the person and their games", async () => {
    await setAsNewHireRecord(input);
    const sql = sentStatements(client).map((statement) => statement.sql);
    expect(sql).toHaveLength(3);
    expect(sql[0]).toMatch(/^select .* from people where people\.id = \$1/);
    expect(sql[1]).toMatch(/^select .* from games where/);
    expect(sql.join(" ")).not.toMatch(/welcomer_clues|team_id|ask|clerk_user_id/);
  });

  it.each(["found", "revealed"])(
    "refuses someone whose mission is %s: a finished player is never locked again",
    async (status) => {
      client.query.mockReset();
      answer({ played: [[status]] });
      await expect(setAsNewHireRecord(input)).rejects.toSatisfy(
        (err) => isAppError(err, "conflict") && err.safeMessage === "They've already played.",
      );
      expect(sentStatements(client).some(({ sql }) => sql.startsWith("update people"))).toBe(false);
    },
  );

  it("lets someone with a running mission through", async () => {
    client.query.mockReset();
    answer({ played: [["active"]] });
    await expect(setAsNewHireRecord(input)).resolves.toBeUndefined();
  });

  it("flags someone who has not signed in yet, as an invited person is", async () => {
    await expect(setAsNewHireRecord(input)).resolves.toBeUndefined();
  });

  it("answers not found for an unknown person", async () => {
    client.query.mockReset();
    answer({ person: [] });
    await expect(setAsNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
  });
});
