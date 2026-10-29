import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const records = vi.hoisted(() => ({ listActiveWelcomerIds: vi.fn() }));
vi.mock("./game-records", () => records);

const candidates = vi.hoisted(() => ({ listWelcomerCandidates: vi.fn() }));
vi.mock("./new-hire-records", () => candidates);

const welcoming = vi.hoisted(() => ({ findActiveWelcomerGame: vi.fn() }));
vi.mock("./find-active-welcomer-game", () => welcoming);

const people = vi.hoisted(() => ({ findPersonByEmail: vi.fn() }));
vi.mock("@/shared/lib/person-records", () => people);

import { createNewHireRecord } from "./create-new-hire-record";

const now = new Date("2026-10-28T15:00:00Z");
const welcomer = {
  id: "ana",
  name: "Ana Ferreira",
  email: "ana@inbeat.agency",
  hidden: false,
  teamId: "team_1",
  ask: "Night trains",
  writtenClues: [2, 3, 4],
};
const input = {
  email: "sam@gmail.com",
  startDate: "2026-11-02",
  adminPersonId: "admin",
  now,
};

const insert = () => sentStatements(client).find(({ sql }) => sql.startsWith("insert into games"));

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [["game_1"]] });
  candidates.listWelcomerCandidates.mockResolvedValue([welcomer]);
  records.listActiveWelcomerIds.mockResolvedValue([]);
  people.findPersonByEmail.mockResolvedValue(undefined);
  welcoming.findActiveWelcomerGame.mockReset();
  welcoming.findActiveWelcomerGame.mockResolvedValue(null);
});

describe("createNewHireRecord", () => {
  it("creates the game with a random welcomer and the admin as its creator", async () => {
    await expect(createNewHireRecord(input)).resolves.toEqual({
      gameId: "game_1",
      welcomerName: "Ana Ferreira",
    });
    expect(insert()?.params).toEqual(
      expect.arrayContaining(["sam@gmail.com", "2026-11-02", "ana", "admin"]),
    );
  });

  it("refuses someone who is welcoming a new hire right now", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "ana", clerkUserId: "user_ana" });
    welcoming.findActiveWelcomerGame.mockResolvedValue({ id: "game_9" });
    await expect(createNewHireRecord(input)).rejects.toSatisfy(
      (err) =>
        isAppError(err, "conflict") && err.safeMessage === "They're welcoming someone right now.",
    );
    expect(welcoming.findActiveWelcomerGame).toHaveBeenCalledWith("ana", now);
    expect(insert()).toBeUndefined();
  });

  it("allows a teammate whose welcomer game is over", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "ana", clerkUserId: "user_ana" });
    await expect(createNewHireRecord(input)).resolves.toMatchObject({ gameId: "game_1" });
  });

  it("leaves the player unlinked until they sign in", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "sam", clerkUserId: null });
    await createNewHireRecord(input);
    expect(insert()?.params).not.toContain("sam");
  });

  it("links a new hire who already signed in", async () => {
    people.findPersonByEmail.mockResolvedValue({ id: "sam", clerkUserId: "user_sam" });
    await createNewHireRecord(input);
    expect(insert()?.params).toContain("sam");
  });

  it("never picks a teammate who is already welcoming", async () => {
    records.listActiveWelcomerIds.mockResolvedValue(["ana"]);
    await expect(createNewHireRecord(input)).rejects.toSatisfy((err) =>
      isAppError(err, "not_found"),
    );
    expect(insert()).toBeUndefined();
  });

  it("refuses a first day in the past before touching the database", async () => {
    await expect(createNewHireRecord({ ...input, startDate: "2026-10-27" })).rejects.toSatisfy(
      (err) => isAppError(err, "validation"),
    );
    expect(client.query).not.toHaveBeenCalled();
  });

  it("turns a second active game for the email into a conflict", async () => {
    client.query.mockRejectedValue(Object.assign(new Error("duplicate"), { code: "23505" }));
    await expect(createNewHireRecord(input)).rejects.toSatisfy(
      (err) => isAppError(err, "conflict") && err.safeMessage === "This email already has a game.",
    );
  });
});
