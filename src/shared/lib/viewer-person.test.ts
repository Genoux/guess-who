import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "@/db/schema";

const records = vi.hoisted(() => ({
  findPersonByClerkUserId: vi.fn(),
  findPeopleByAnyEmail: vi.fn(),
  claimPerson: vi.fn(),
  refreshPersonIdentity: vi.fn(),
}));
const { getVerifiedIdentity } = vi.hoisted(() => ({ getVerifiedIdentity: vi.fn() }));
const { authorizeMember } = vi.hoisted(() => ({ authorizeMember: vi.fn() }));
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect ${path}`);
  }),
}));

vi.mock("./person-records", () => records);
vi.mock("./clerk-identity", () => ({ getVerifiedIdentity }));
vi.mock("./auth", () => ({ authorizeMember }));
vi.mock("next/navigation", () => ({ redirect }));

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
  imageUrl: null,
  photoKey: null,
  slackUserId: null,
  syncedSessionId: null,
  stickerNumber: 1,
  hidden: false,
  newHire: false,
  personalEmail: null,
  deelId: null,
  startDate: null,
  autoMissionDoneAt: null,
  welcomerLeftAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const identity = (email: string) =>
  getVerifiedIdentity.mockResolvedValue({
    email,
    name: "Maya",
    imageUrl: null,
    slackUserId: "U123",
  });
const firstSignIn = () => records.findPersonByClerkUserId.mockResolvedValueOnce(undefined);
const failsWith = (kind: "forbidden" | "conflict") => (err: unknown) => isAppError(err, kind);

beforeEach(() => {
  for (const fn of Object.values(records)) fn.mockReset();
  getVerifiedIdentity.mockReset();
  authorizeMember.mockReset();
  redirect.mockClear();
  records.findPeopleByAnyEmail.mockResolvedValue([]);
  identity("maya@inbeat.agency");
});

describe("syncViewerPerson", () => {
  it("returns the row without calling Clerk when this session already synced it", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(person({ syncedSessionId: "session_1" }));
    await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
      id: "person_1",
    });
    expect(getVerifiedIdentity).not.toHaveBeenCalled();
    expect(records.refreshPersonIdentity).not.toHaveBeenCalled();
    expect(records.findPeopleByAnyEmail).not.toHaveBeenCalled();
  });

  it("re-reads Clerk on a new session and refreshes the photo, Slack id and session", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(person({ syncedSessionId: "session_1" }));
    getVerifiedIdentity.mockResolvedValue({
      email: "maya@inbeat.agency",
      name: "Maya",
      imageUrl: "https://img.slack/maya",
      slackUserId: "U123",
    });
    records.refreshPersonIdentity.mockResolvedValue(
      person({ slackUserId: "U123", syncedSessionId: "session_2" }),
    );
    await expect(syncViewerPerson("user_1", "session_2")).resolves.toMatchObject({
      syncedSessionId: "session_2",
    });
    expect(records.refreshPersonIdentity).toHaveBeenCalledWith("person_1", "session_2", {
      imageUrl: "https://img.slack/maya",
      slackUserId: "U123",
    });
  });

  it("keeps the row when the refresh returns nothing", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(person());
    records.refreshPersonIdentity.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1", "session_2")).resolves.toMatchObject({
      id: "person_1",
    });
  });

  it.each([
    ["Clerk cannot be read", () => getVerifiedIdentity.mockRejectedValue(new Error("clerk down"))],
    [
      "the Slack id is already on another row",
      () => records.refreshPersonIdentity.mockRejectedValue(new Error("unique violation")),
    ],
  ])("keeps the stored row when %s, so the page still loads", async (_case, fail) => {
    records.findPersonByClerkUserId.mockResolvedValue(person());
    fail();
    await expect(syncViewerPerson("user_1", "session_2")).resolves.toMatchObject({
      id: "person_1",
    });
  });

  it("still refuses a linked viewer whose email Clerk no longer verifies", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(person());
    getVerifiedIdentity.mockRejectedValue(
      new AppError("forbidden", "primary email is not verified"),
    );
    await expect(syncViewerPerson("user_1", "session_2")).rejects.toSatisfy(failsWith("forbidden"));
  });

  it.each([
    ["work", "maya@inbeat.agency"],
    ["personal", "maya@gmail.com"],
  ])(
    "links the one person whose %s email matches, leaving their name alone",
    async (_kind, email) => {
      firstSignIn();
      identity(email);
      records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: null })]);
      records.claimPerson.mockResolvedValue(person());
      await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
        id: "person_1",
      });
      expect(records.findPeopleByAnyEmail).toHaveBeenCalledWith(email);
      expect(records.claimPerson).toHaveBeenCalledWith("person_1", "user_1", "session_1", {
        imageUrl: null,
        slackUserId: "U123",
      });
    },
  );

  it("claims without the Slack id when another row already holds it", async () => {
    firstSignIn();
    records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: null })]);
    records.claimPerson
      .mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: "23505" }))
      .mockResolvedValueOnce(person());
    await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
      id: "person_1",
    });
    expect(records.claimPerson).toHaveBeenLastCalledWith("person_1", "user_1", "session_1", {
      imageUrl: null,
      slackUserId: null,
    });
  });

  it("lets any other claim failure through", async () => {
    firstSignIn();
    records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: null })]);
    records.claimPerson.mockRejectedValue(new Error("db down"));
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toThrow("db down");
    expect(records.claimPerson).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["matches nobody", []],
    ["matches two people", [person({ clerkUserId: null }), person({ id: "person_2" })]],
  ])("refuses a viewer whose email %s, and creates no row", async (_case, matches) => {
    firstSignIn();
    identity("stranger@inbeat.agency");
    records.findPeopleByAnyEmail.mockResolvedValue(matches);
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("forbidden"));
    expect(records.claimPerson).not.toHaveBeenCalled();
  });

  it("never moves a row linked to another Clerk user", async () => {
    firstSignIn();
    records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: "user_other" })]);
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("forbidden"));
    expect(records.claimPerson).not.toHaveBeenCalled();
  });

  it("does not look anything up when Clerk has not verified the email", async () => {
    firstSignIn();
    getVerifiedIdentity.mockRejectedValue(new AppError("forbidden", "unverified"));
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("forbidden"));
    expect(records.findPeopleByAnyEmail).not.toHaveBeenCalled();
  });

  it("returns the winner's row when a concurrent request claimed it first", async () => {
    firstSignIn();
    records.findPersonByClerkUserId.mockResolvedValueOnce(person());
    records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: null })]);
    records.claimPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
      id: "person_1",
    });
  });

  it("fails when another Clerk user claimed the row in between", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPeopleByAnyEmail.mockResolvedValue([person({ clerkUserId: null })]);
    records.claimPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("conflict"));
  });
});

describe("getViewerPerson", () => {
  it("authorizes before touching the database", async () => {
    authorizeMember.mockRejectedValue(new AppError("auth", "no session"));
    await expect(getViewerPerson()).rejects.toSatisfy((err) => isAppError(err, "auth"));
    expect(records.findPersonByClerkUserId).not.toHaveBeenCalled();
  });

  it("returns the viewer with their person", async () => {
    authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "session_1", role: "member" });
    records.findPersonByClerkUserId.mockResolvedValue(person());
    await expect(getViewerPerson()).resolves.toMatchObject({
      userId: "user_1",
      role: "member",
      person: { id: "person_1" },
    });
  });

  it("sends a refused viewer to the not-on-the-list page", async () => {
    authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "session_1", role: "member" });
    firstSignIn();
    identity("stranger@gmail.com");
    await expect(getViewerPerson()).rejects.toThrow("redirect /not-on-the-list");
    expect(redirect).toHaveBeenCalledWith("/not-on-the-list");
  });

  it("does not hide other failures behind the redirect", async () => {
    authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "session_1", role: "member" });
    records.findPersonByClerkUserId.mockRejectedValue(new Error("db down"));
    await expect(getViewerPerson()).rejects.toThrow("db down");
    expect(redirect).not.toHaveBeenCalled();
  });
});
