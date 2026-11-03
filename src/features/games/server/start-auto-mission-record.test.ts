import { AppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const started = vi.hoisted(() => ({ startAsNewHireRecord: vi.fn() }));
vi.mock("./start-as-new-hire-record", () => started);

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { sentStatements } from "@/test/fake-db";
import { ALREADY_HAS_MISSION } from "./begin-mission-record";
import { startAutoMissionRecord } from "./start-auto-mission-record";

const now = new Date("2026-11-02T15:00:00Z");

/** The person row found by deel id: `[id, auto_mission_done_at]`. */
const answer = (rows: unknown[][]) => client.query.mockResolvedValue({ rows });

beforeEach(() => {
  client.query.mockReset();
  started.startAsNewHireRecord.mockReset();
  started.startAsNewHireRecord.mockResolvedValue({ started: true });
  answer([["person_1", null]]);
});

describe("startAutoMissionRecord", () => {
  it("starts the mission of a person with no marker, as a new hire, with no admin", async () => {
    await expect(startAutoMissionRecord({ deelId: "d1", now })).resolves.toBe("mission started");
    expect(started.startAsNewHireRecord).toHaveBeenCalledWith({
      personId: "person_1",
      adminPersonId: null,
      now,
    });
  });

  it("looks the person up by deel id", async () => {
    await startAutoMissionRecord({ deelId: "d1", now });
    const select = sentStatements(client)[0];
    expect(select?.sql).toMatch(/where people\.deel_id = \$1/);
    expect(select?.params).toEqual(["d1"]);
  });

  it("does nothing once the marker is set", async () => {
    answer([["person_1", new Date("2026-10-01T00:00:00Z")]]);
    await expect(startAutoMissionRecord({ deelId: "d1", now })).resolves.toBe(
      "auto mission already done",
    );
    expect(started.startAsNewHireRecord).not.toHaveBeenCalled();
  });

  it("does nothing for an unknown person", async () => {
    answer([]);
    await expect(startAutoMissionRecord({ deelId: "d1", now })).resolves.toBe("unknown person");
    expect(started.startAsNewHireRecord).not.toHaveBeenCalled();
  });

  it("leaves the person flagged for a later event when no welcomer is free", async () => {
    started.startAsNewHireRecord.mockResolvedValue({ started: false });
    await expect(startAutoMissionRecord({ deelId: "d1", now })).resolves.toBe("no welcomer free");
  });

  it("does nothing for a person who already has a mission", async () => {
    started.startAsNewHireRecord.mockRejectedValue(
      new AppError("conflict", "person already has a mission", {
        safeMessage: ALREADY_HAS_MISSION,
      }),
    );
    await expect(startAutoMissionRecord({ deelId: "d1", now })).resolves.toBe(
      "already has a mission",
    );
  });

  it("lets any other failure through", async () => {
    started.startAsNewHireRecord.mockRejectedValue(new Error("db down"));
    await expect(startAutoMissionRecord({ deelId: "d1", now })).rejects.toThrow("db down");
  });
});
