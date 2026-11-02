import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("./db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
const mocks = vi.hoisted(() => ({ finalize: vi.fn() }));
vi.mock("./finalize-expired-game-record", () => ({ finalizeExpiredGameRecord: mocks.finalize }));

import { findActiveWelcomerGame } from "./find-active-welcomer-game";

const now = new Date("2026-11-05T15:00:00Z");
// Rows come back as arrays in column order, id first; the rest is null.
const gameRow = ["game_1", ...Array.from({ length: 20 }, () => null)];

beforeEach(() => {
  vi.clearAllMocks();
  client.query.mockResolvedValue({ rows: [] });
  mocks.finalize.mockImplementation(async (value) => value);
});

describe("findActiveWelcomerGame", () => {
  it("looks for the active game where they are the welcomer", async () => {
    await findActiveWelcomerGame("ana", now);
    const [select] = sentStatements(client);
    expect(select?.sql).toMatch(
      /from games where \(games\.welcomer_person_id = \$1 and games\.status = \$2\) limit \$3/,
    );
    expect(select?.params).toEqual(["ana", "active", 1]);
  });

  it("returns the game they are welcoming", async () => {
    client.query.mockResolvedValueOnce({ rows: [gameRow] });
    mocks.finalize.mockImplementation(async (value) => ({ ...value, status: "active" }));
    await expect(findActiveWelcomerGame("ana", now)).resolves.toMatchObject({ id: "game_1" });
  });

  it("returns null when they welcome nobody, without finalizing anything", async () => {
    await expect(findActiveWelcomerGame("ana", now)).resolves.toBeNull();
    expect(mocks.finalize).not.toHaveBeenCalled();
  });

  it("returns null once the game ended, even if it was only just found out", async () => {
    client.query.mockResolvedValueOnce({ rows: [gameRow] });
    mocks.finalize.mockImplementation(async (value) => ({ ...value, status: "revealed" }));
    await expect(findActiveWelcomerGame("ana", now)).resolves.toBeNull();
  });
});
