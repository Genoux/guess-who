import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { writeClueRecord } from "./write-clue-record";

const game = {
  id: "game_1",
  welcomerPersonId: "welcomer",
  status: "active" as const,
  startDate: "2026-11-02",
};
const day4 = new Date("2026-11-05T15:00:00Z");
const write = (overrides: Partial<Parameters<typeof writeClueRecord>[0]> = {}) =>
  writeClueRecord({
    game,
    viewerPersonId: "welcomer",
    number: 2,
    text: "Has never owned a car.",
    now: day4,
    ...overrides,
  });

beforeEach(() => {
  client.query.mockClear();
});

describe("writeClueRecord", () => {
  it("upserts the clue with its scheduled release time", async () => {
    await write();
    const [upsert] = sentStatements(client);
    expect(upsert?.sql).toMatch(
      /insert into clues .* on conflict \(game_id,number\) do update set text = \$\d+, release_at = \$\d+/,
    );
    expect(upsert?.params).toEqual(
      expect.arrayContaining(["game_1", 2, "Has never owned a car.", "2026-11-07T14:00:00.000Z"]),
    );
  });

  it("forbids anyone but the welcomer", async () => {
    await expect(write({ viewerPersonId: "player" })).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("locks a clue once it has landed", async () => {
    await expect(write({ now: new Date("2026-11-07T14:00:00Z") })).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
  });

  it("refuses the generated team clue", async () => {
    await expect(write({ number: 1 })).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});
