import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeelPerson } from "@/integrations/deel/deel-person";

const upsert = vi.hoisted(() => ({ upsertRosterPersonRecord: vi.fn() }));
vi.mock("./upsert-roster-person-record", () => upsert);
vi.mock("@/shared/lib/db", () => ({
  db: { transaction: (run: (tx: string) => unknown) => run("tx") },
}));

import { syncDeelPersonRecord } from "./sync-deel-person-record";

const activePerson: DeelPerson = {
  id: "p1",
  first_name: "Sam",
  last_name: "Seed",
  emails: [{ type: "work", value: "sam@example.test" }],
  hiring_status: "active",
  country: "CA",
  department: { id: "d", name: "Design (IB)" },
  client_legal_entity: { id: "e", name: "9434-1641 QUEBEC INC." },
  employments: [{ id: "c1" }],
};

const deel = { getPerson: vi.fn(), findPersonByContractId: vi.fn() };
const sync = (subject: Parameters<typeof syncDeelPersonRecord>[0]["subject"]) =>
  syncDeelPersonRecord({ deel, subject });

beforeEach(() => {
  vi.resetAllMocks();
  upsert.upsertRosterPersonRecord.mockResolvedValue("created");
});

describe("syncDeelPersonRecord", () => {
  it("fetches a person subject by id and upserts an active in-scope person", async () => {
    deel.getPerson.mockResolvedValue(activePerson);
    expect(await sync({ kind: "person", id: "p1" })).toBe("created");
    expect(deel.getPerson).toHaveBeenCalledWith("p1");
    expect(upsert.upsertRosterPersonRecord).toHaveBeenCalledWith(
      "tx",
      expect.objectContaining({ deelId: "p1", email: "sam@example.test" }),
    );
  });

  it("resolves a contract subject through the contract lookup", async () => {
    deel.findPersonByContractId.mockResolvedValue(activePerson);
    expect(await sync({ kind: "contract", id: "c1" })).toBe("created");
    expect(deel.findPersonByContractId).toHaveBeenCalledWith("c1");
    expect(deel.getPerson).not.toHaveBeenCalled();
  });

  it("ignores a contract no person owns", async () => {
    deel.findPersonByContractId.mockResolvedValue(null);
    expect(await sync({ kind: "contract", id: "c9" })).toBe("unknown contract");
    expect(upsert.upsertRosterPersonRecord).not.toHaveBeenCalled();
  });

  it("only reports a leaver, never writes", async () => {
    deel.getPerson.mockResolvedValue({ ...activePerson, hiring_status: "inactive" });
    expect(await sync({ kind: "person", id: "p1" })).toBe("leaver not removed yet");
    expect(upsert.upsertRosterPersonRecord).not.toHaveBeenCalled();
  });

  it("reports a deleted person as a leaver", async () => {
    deel.getPerson.mockResolvedValue(null);
    expect(await sync({ kind: "person", id: "p1" })).toBe("leaver not removed yet");
  });

  it("reports why a person is ignored", async () => {
    deel.getPerson.mockResolvedValue({
      ...activePerson,
      client_legal_entity: { id: "x", name: "Elsewhere LLC" },
    });
    expect(await sync({ kind: "person", id: "p1" })).toBe("ignored: out of scope");
    expect(upsert.upsertRosterPersonRecord).not.toHaveBeenCalled();
  });

  it("passes on a cross-email conflict", async () => {
    deel.getPerson.mockResolvedValue(activePerson);
    upsert.upsertRosterPersonRecord.mockResolvedValue("conflict");
    expect(await sync({ kind: "person", id: "p1" })).toBe("conflict");
  });

  it("turns a unique violation from a racing delivery into a retryable error", async () => {
    deel.getPerson.mockResolvedValue(activePerson);
    upsert.upsertRosterPersonRecord.mockRejectedValueOnce(
      new Error("Failed query: insert into people", {
        cause: Object.assign(new Error("duplicate key"), { code: "23505" }),
      }),
    );
    const error = await sync({ kind: "person", id: "p1" }).catch((caught: unknown) => caught);
    expect(isAppError(error, "db_transient")).toBe(true);
    expect((error as { isRetryable: boolean }).isRetryable).toBe(true);
  });

  it("rethrows other write errors unchanged", async () => {
    deel.getPerson.mockResolvedValue(activePerson);
    const failure = new Error("boom");
    upsert.upsertRosterPersonRecord.mockRejectedValueOnce(failure);
    await expect(sync({ kind: "person", id: "p1" })).rejects.toBe(failure);
  });
});
