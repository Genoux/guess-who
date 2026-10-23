import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ hasCollected: vi.fn() }));
vi.mock("./game-records", () => records);

import { saveNoteRecord } from "./save-note-record";

const game = { id: "game_1", playerPersonId: "player" };
const input = { game, viewerPersonId: "player", personId: "teammate", note: "Plays the cello." };

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  records.hasCollected.mockResolvedValue(true);
});

describe("saveNoteRecord", () => {
  it("updates the note of this game's collection only", async () => {
    await saveNoteRecord(input);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /update collections set note = \$1, updated_at = \$2 where \(collections\.game_id = \$3 and collections\.person_id = \$4\)/,
    );
    expect(update?.params).toEqual(
      expect.arrayContaining(["Plays the cello.", "game_1", "teammate"]),
    );
  });

  it("refuses an uncollected sticker without writing", async () => {
    records.hasCollected.mockResolvedValue(false);
    await expect(saveNoteRecord(input)).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses anyone but the player", async () => {
    await expect(saveNoteRecord({ ...input, viewerPersonId: "teammate" })).rejects.toSatisfy(
      (err) => isAppError(err, "forbidden"),
    );
  });
});
