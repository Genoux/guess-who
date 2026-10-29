import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({
  findGameById: vi.fn(),
  listActiveWelcomerIds: vi.fn(),
}));
vi.mock("./game-records", () => records);

const candidates = vi.hoisted(() => ({ listWelcomerCandidates: vi.fn() }));
vi.mock("./new-hire-records", () => candidates);

const welcoming = vi.hoisted(() => ({ findActiveWelcomerGame: vi.fn() }));
vi.mock("./find-active-welcomer-game", () => welcoming);

const people = vi.hoisted(() => ({ findPersonByEmail: vi.fn() }));
vi.mock("@/shared/lib/person-records", () => people);

import { updateNewHireRecord } from "./update-new-hire-record";

const now = new Date("2026-10-28T15:00:00Z");
const upcoming = {
  id: "game_1",
  status: "active",
  startDate: "2026-11-02",
  playerEmail: "sam@gmail.com",
  playerPersonId: null,
  welcomerPersonId: "ana",
};
const input = { gameId: "game_1", email: "sam@gmail.com", startDate: "2026-11-02", now };

const person = (id: string) => ({
  id,
  email: `${id}@inbeat.agency`,
  hidden: false,
  teamId: "team_1",
  ask: "Night trains",
  writtenClues: [2, 3, 4],
});

const sent = () => sentStatements(client).map(({ sql }) => sql);
const failsWith = (kind: "forbidden" | "validation" | "not_found" | "conflict") =>
  expect.toSatisfy((err) => isAppError(err, kind));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["game_1"]] });
  records.findGameById.mockResolvedValue(upcoming);
  candidates.listWelcomerCandidates.mockResolvedValue([
    person("ana"),
    person("ben"),
    person("cleo"),
  ]);
  records.listActiveWelcomerIds.mockResolvedValue(["ana", "cleo"]);
  people.findPersonByEmail.mockResolvedValue(undefined);
  welcoming.findActiveWelcomerGame.mockReset();
  welcoming.findActiveWelcomerGame.mockResolvedValue(null);
});

describe("updateNewHireRecord", () => {
  it("fixes the email of a game that has not started", async () => {
    await updateNewHireRecord({ ...input, email: "sam.taylor@gmail.com" });
    const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
    expect(update?.sql).toMatch(
      /where \(games\.id = \$\d and games\.status = \$\d and games\.player_person_id is null\)/,
    );
    expect(update?.params).toContain("sam.taylor@gmail.com");
  });

  it("refuses a new email that belongs to someone welcoming a new hire right now", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "ana", clerkUserId: "user_ana" });
    welcoming.findActiveWelcomerGame.mockResolvedValue({ id: "game_9" });
    await expect(updateNewHireRecord({ ...input, email: "ana@inbeat.agency" })).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") && err.safeMessage === "They're welcoming someone right now.",
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("does not look at who welcomes when the email stays", async () => {
    await updateNewHireRecord(input);
    expect(welcoming.findActiveWelcomerGame).not.toHaveBeenCalled();
  });

  it("changes the email of a game that has started but not its day", async () => {
    records.findGameById.mockResolvedValue({ ...upcoming, startDate: "2026-10-26" });
    await expect(
      updateNewHireRecord({ ...input, startDate: "2026-10-26", email: "sam.t@gmail.com" }),
    ).resolves.toBeUndefined();
  });

  it("refuses to move the first day once the game has started", async () => {
    records.findGameById.mockResolvedValue({ ...upcoming, startDate: "2026-10-26" });
    await expect(updateNewHireRecord({ ...input, startDate: "2026-11-02" })).rejects.toThrow(
      failsWith("validation"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses a new first day in the past", async () => {
    await expect(updateNewHireRecord({ ...input, startDate: "2026-10-20" })).rejects.toThrow(
      failsWith("validation"),
    );
  });

  it("refuses a game that has started and has a signed-in player", async () => {
    records.findGameById.mockResolvedValue({
      ...upcoming,
      startDate: "2026-10-26",
      playerPersonId: "sam",
    });
    await expect(updateNewHireRecord({ ...input, startDate: "2026-10-26" })).rejects.toThrow(
      failsWith("forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  describe("a game the player already signed in to, before it starts", () => {
    const linked = { ...upcoming, playerPersonId: "sam" };

    beforeEach(() => records.findGameById.mockResolvedValue(linked));

    it("moves the first day and leaves the email and the link alone", async () => {
      await updateNewHireRecord({ ...input, startDate: "2026-11-09" });
      const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
      expect(update?.params).toContain("2026-11-09");
      expect(update?.sql).not.toMatch(/player_email = /);
      expect(update?.sql).not.toMatch(/set .*player_person_id = /);
    });

    it("swaps the welcomer", async () => {
      await updateNewHireRecord({ ...input, welcomerPersonId: "ben" });
      const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
      expect(update?.params).toContain("ben");
    });

    it("refuses a new email", async () => {
      await expect(updateNewHireRecord({ ...input, email: "other@gmail.com" })).rejects.toSatisfy(
        (err) => isAppError(err, "forbidden"),
      );
      expect(client.query).not.toHaveBeenCalled();
    });
  });

  it("answers not found for an unknown game", async () => {
    records.findGameById.mockResolvedValue(undefined);
    await expect(updateNewHireRecord(input)).rejects.toThrow(failsWith("not_found"));
  });

  it("links the player when the new email already signed in", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "sam", clerkUserId: "user_sam" });
    await updateNewHireRecord({ ...input, email: "sam@inbeat.agency" });
    const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
    expect(update?.params).toContain("sam");
  });

  it("refuses when the player signed in between the read and the write", async () => {
    client.query.mockResolvedValue({ rows: [] });
    await expect(updateNewHireRecord(input)).rejects.toThrow(failsWith("forbidden"));
  });

  it("turns a duplicate email into a conflict", async () => {
    client.query.mockRejectedValue(Object.assign(new Error("duplicate"), { code: "23505" }));
    await expect(updateNewHireRecord({ ...input, email: "taken@gmail.com" })).rejects.toThrow(
      failsWith("conflict"),
    );
  });
});

describe("changing the welcomer", () => {
  const sql = () => sent();

  it("swaps the welcomer and touches no clue: each teammate keeps their own", async () => {
    await updateNewHireRecord({ ...input, welcomerPersonId: "ben" });
    const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
    expect(update?.params).toContain("ben");
    expect(sql().some((statement) => /clues/.test(statement))).toBe(false);
  });

  it("changes nothing about the welcomer when it stays", async () => {
    await updateNewHireRecord({ ...input, welcomerPersonId: "ana" });
    const update = sentStatements(client).find(({ sql }) => sql.startsWith("update games"));
    expect(update?.sql).not.toMatch(/welcomer_person_id = /);
  });

  it("refuses a teammate already welcoming another game", async () => {
    await expect(updateNewHireRecord({ ...input, welcomerPersonId: "cleo" })).rejects.toThrow(
      failsWith("forbidden"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("refuses the new hire's own card", async () => {
    candidates.listWelcomerCandidates.mockResolvedValue([person("ana"), person("sam")]);
    await expect(
      updateNewHireRecord({ ...input, email: "sam@inbeat.agency", welcomerPersonId: "sam" }),
    ).rejects.toThrow(failsWith("forbidden"));
  });

  it("refuses once the game has started", async () => {
    records.findGameById.mockResolvedValue({ ...upcoming, startDate: "2026-10-26" });
    await expect(
      updateNewHireRecord({ ...input, startDate: "2026-10-26", welcomerPersonId: "ben" }),
    ).rejects.toThrow(failsWith("forbidden"));
    expect(client.query).not.toHaveBeenCalled();
  });
});
