import { isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "./person-records";

const records = vi.hoisted(() => ({
  findPersonByClerkUserId: vi.fn(),
  findPersonByEmail: vi.fn(),
  claimPerson: vi.fn(),
  insertPerson: vi.fn(),
  linkPlayerGames: vi.fn(),
}));
const { getVerifiedIdentity } = vi.hoisted(() => ({ getVerifiedIdentity: vi.fn() }));
const { authorizeMember } = vi.hoisted(() => ({ authorizeMember: vi.fn() }));

vi.mock("./person-records", () => records);
vi.mock("./clerk-identity", () => ({ getVerifiedIdentity }));
vi.mock("./auth", () => ({ authorizeMember }));

import { getViewerPerson, syncViewerPerson } from "./viewer-person";

const person = (overrides: Partial<Person> = {}): Person => ({
  id: "person_1",
  clerkUserId: "user_1",
  email: "maya@inbeat.agency",
  name: "Maya",
  teamId: null,
  location: null,
  fact: null,
  ask: null,
  photoKey: null,
  stickerNumber: 1,
  hidden: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  for (const fn of Object.values(records)) fn.mockReset();
  getVerifiedIdentity.mockReset();
  records.linkPlayerGames.mockResolvedValue([]);
  getVerifiedIdentity.mockResolvedValue({ email: "maya@inbeat.agency", name: "Maya" });
});

describe("syncViewerPerson", () => {
  it("returns the row already linked to the Clerk user without calling Clerk", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(person());
    await expect(syncViewerPerson("user_1")).resolves.toMatchObject({ id: "person_1" });
    expect(getVerifiedIdentity).not.toHaveBeenCalled();
    expect(records.insertPerson).not.toHaveBeenCalled();
  });

  it("links an unclaimed row with the same verified email", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: null }));
    records.claimPerson.mockResolvedValue(person());
    await expect(syncViewerPerson("user_1")).resolves.toMatchObject({ clerkUserId: "user_1" });
    expect(records.findPersonByEmail).toHaveBeenCalledWith("maya@inbeat.agency");
    expect(records.claimPerson).toHaveBeenCalledWith("person_1", "user_1");
    expect(records.insertPerson).not.toHaveBeenCalled();
  });

  it("creates a row when nobody has the email", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPersonByEmail.mockResolvedValue(undefined);
    records.insertPerson.mockResolvedValue(person());
    await expect(syncViewerPerson("user_1")).resolves.toMatchObject({ id: "person_1" });
    expect(records.insertPerson).toHaveBeenCalledWith({
      clerkUserId: "user_1",
      email: "maya@inbeat.agency",
      name: "Maya",
    });
  });

  it("never moves a row linked to another Clerk user", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: "user_other" }));
    await expect(syncViewerPerson("user_1")).rejects.toSatisfy((err) =>
      isAppError(err, "forbidden"),
    );
    expect(records.claimPerson).not.toHaveBeenCalled();
    expect(records.linkPlayerGames).not.toHaveBeenCalled();
  });

  it("does not link anything when Clerk has not verified the email", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    getVerifiedIdentity.mockRejectedValue(new Error("unverified"));
    await expect(syncViewerPerson("user_1")).rejects.toThrow("unverified");
    expect(records.findPersonByEmail).not.toHaveBeenCalled();
    expect(records.insertPerson).not.toHaveBeenCalled();
  });

  it("returns the winner's row when a concurrent request created it first", async () => {
    records.findPersonByClerkUserId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(person());
    records.findPersonByEmail.mockResolvedValue(undefined);
    records.insertPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1")).resolves.toMatchObject({ id: "person_1" });
  });

  it("fails when another Clerk user claimed the row in between", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: null }));
    records.claimPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1")).rejects.toSatisfy((err) =>
      isAppError(err, "conflict"),
    );
  });

  it("links the person as player of games created for their email", async () => {
    const synced = person();
    records.findPersonByClerkUserId.mockResolvedValue(synced);
    records.linkPlayerGames.mockResolvedValue([{ id: "game_1" }]);
    await syncViewerPerson("user_1");
    expect(records.linkPlayerGames).toHaveBeenCalledWith(synced);
  });
});

describe("getViewerPerson", () => {
  it("authorizes before touching the database", async () => {
    authorizeMember.mockRejectedValue(new Error("no session"));
    await expect(getViewerPerson()).rejects.toThrow("no session");
    expect(records.findPersonByClerkUserId).not.toHaveBeenCalled();
  });

  it("returns the viewer with their person", async () => {
    authorizeMember.mockResolvedValue({ userId: "user_1", role: "member" });
    records.findPersonByClerkUserId.mockResolvedValue(person());
    await expect(getViewerPerson()).resolves.toMatchObject({
      userId: "user_1",
      role: "member",
      person: { id: "person_1" },
    });
  });
});
