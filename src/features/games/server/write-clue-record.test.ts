import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ findActiveWelcomerGame: vi.fn() }));
vi.mock("@/shared/lib/find-active-welcomer-game", () => records);

import { writeClueRecord } from "./write-clue-record";

const now = new Date("2026-11-05T15:00:00Z");
const write = (overrides: Partial<Parameters<typeof writeClueRecord>[0]> = {}) =>
  writeClueRecord({
    personId: "teammate",
    number: 2,
    text: "Has never owned a car.",
    now,
    ...overrides,
  });

beforeEach(() => {
  client.query.mockClear();
  records.findActiveWelcomerGame.mockReset();
  records.findActiveWelcomerGame.mockResolvedValue(null);
});

describe("writeClueRecord", () => {
  it("saves the clue on the person, not on a game", async () => {
    await write();
    const [upsert] = sentStatements(client);
    expect(upsert?.sql).toMatch(
      /insert into welcomer_clues .* on conflict \(person_id,number\) do update set text = \$\d+/,
    );
    expect(upsert?.params).toEqual(
      expect.arrayContaining(["teammate", 2, "Has never owned a car."]),
    );
  });

  it("deletes the clue when the text is blank, instead of storing it", async () => {
    await write({ text: "" });
    const [statement] = sentStatements(client);
    expect(statement?.sql).toMatch(
      /delete from welcomer_clues where \(welcomer_clues\.person_id = \$1 and welcomer_clues\.number = \$2\)/,
    );
    expect(statement?.params).toEqual(["teammate", 2]);
  });

  it("refuses to change a clue while they welcome a started mission", async () => {
    records.findActiveWelcomerGame.mockResolvedValue({ id: "game_1" });
    await expect(write()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses to clear a clue while they welcome a started mission", async () => {
    records.findActiveWelcomerGame.mockResolvedValue({ id: "game_1" });
    await expect(write({ text: "" })).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses the generated team clue", async () => {
    await expect(write({ number: 1 })).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});
