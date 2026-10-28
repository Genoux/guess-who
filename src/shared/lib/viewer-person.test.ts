import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "@/db/schema";

const records = vi.hoisted(() => ({
  findPersonByClerkUserId: vi.fn(),
  findPersonByEmail: vi.fn(),
  hasGameForPlayerEmail: vi.fn(),
  claimPerson: vi.fn(),
  insertPerson: vi.fn(),
  refreshPersonIdentity: vi.fn(),
  linkPersonToGamesByEmail: vi.fn(),
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
vi.mock("@/shared/config/env", () => ({ env: { ALLOWED_EMAIL_DOMAINS: ["inbeat.agency"] } }));

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
  records.linkPersonToGamesByEmail.mockResolvedValue([]);
  records.hasGameForPlayerEmail.mockResolvedValue(false);
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
    expect(records.insertPerson).not.toHaveBeenCalled();
    expect(records.linkPersonToGamesByEmail).not.toHaveBeenCalled();
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

  it("creates a row for an email in the allowed domains and links its games", async () => {
    firstSignIn();
    records.insertPerson.mockResolvedValue(person());
    await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
      id: "person_1",
    });
    expect(records.insertPerson).toHaveBeenCalledWith({
      clerkUserId: "user_1",
      email: "maya@inbeat.agency",
      name: "Maya",
      imageUrl: null,
      slackUserId: "U123",
      syncedSessionId: "session_1",
    });
    expect(records.linkPersonToGamesByEmail).toHaveBeenCalledWith("person_1", "maya@inbeat.agency");
  });

  it("creates a row for an outside email that an admin set up a game for", async () => {
    firstSignIn();
    identity("new.hire@gmail.com");
    records.hasGameForPlayerEmail.mockResolvedValue(true);
    records.insertPerson.mockResolvedValue(person({ email: "new.hire@gmail.com" }));
    await syncViewerPerson("user_1", "session_1");
    expect(records.hasGameForPlayerEmail).toHaveBeenCalledWith("new.hire@gmail.com");
    expect(records.linkPersonToGamesByEmail).toHaveBeenCalledWith("person_1", "new.hire@gmail.com");
  });

  it.each(["stranger@gmail.com", "maya@evil-inbeat.agency", "maya@inbeat.agency.evil.com"])(
    "refuses %s when nobody invited it",
    async (email) => {
      firstSignIn();
      identity(email);
      await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(
        failsWith("forbidden"),
      );
      expect(records.insertPerson).not.toHaveBeenCalled();
      expect(records.linkPersonToGamesByEmail).not.toHaveBeenCalled();
    },
  );

  it("claims a row an admin pre-created, even outside the allowed domains", async () => {
    firstSignIn();
    identity("contractor@gmail.com");
    records.findPersonByEmail.mockResolvedValue(
      person({ clerkUserId: null, email: "contractor@gmail.com" }),
    );
    records.claimPerson.mockResolvedValue(person({ email: "contractor@gmail.com" }));
    await syncViewerPerson("user_1", "session_1");
    expect(records.claimPerson).toHaveBeenCalledWith("person_1", "user_1", "session_1", {
      email: "contractor@gmail.com",
      name: "Maya",
      imageUrl: null,
      slackUserId: "U123",
    });
    expect(records.insertPerson).not.toHaveBeenCalled();
    expect(records.linkPersonToGamesByEmail).toHaveBeenCalledWith(
      "person_1",
      "contractor@gmail.com",
    );
  });

  it("links games by the current verified Clerk email at claim time", async () => {
    firstSignIn();
    identity("maya.chen@inbeat.agency");
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: null }));
    records.claimPerson.mockResolvedValue(person({ email: "stale@inbeat.agency" }));
    await syncViewerPerson("user_1", "session_1");
    expect(records.linkPersonToGamesByEmail).toHaveBeenCalledWith(
      "person_1",
      "maya.chen@inbeat.agency",
    );
  });

  it("never moves a row linked to another Clerk user", async () => {
    firstSignIn();
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: "user_other" }));
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("forbidden"));
    expect(records.claimPerson).not.toHaveBeenCalled();
    expect(records.linkPersonToGamesByEmail).not.toHaveBeenCalled();
  });

  it("does not look anything up when Clerk has not verified the email", async () => {
    firstSignIn();
    getVerifiedIdentity.mockRejectedValue(new AppError("forbidden", "unverified"));
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("forbidden"));
    expect(records.findPersonByEmail).not.toHaveBeenCalled();
    expect(records.insertPerson).not.toHaveBeenCalled();
  });

  it("returns the winner's row when a concurrent request inserted it first", async () => {
    firstSignIn();
    records.findPersonByClerkUserId.mockResolvedValueOnce(person());
    records.insertPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1", "session_1")).resolves.toMatchObject({
      id: "person_1",
    });
  });

  it("fails when another Clerk user claimed the row in between", async () => {
    records.findPersonByClerkUserId.mockResolvedValue(undefined);
    records.findPersonByEmail.mockResolvedValue(person({ clerkUserId: null }));
    records.claimPerson.mockResolvedValue(undefined);
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toSatisfy(failsWith("conflict"));
    expect(records.linkPersonToGamesByEmail).not.toHaveBeenCalled();
  });

  it("lets a database error (a sticker number collision) through", async () => {
    firstSignIn();
    records.insertPerson.mockRejectedValue(new Error("duplicate key people_sticker_number_unique"));
    await expect(syncViewerPerson("user_1", "session_1")).rejects.toThrow(
      "people_sticker_number_unique",
    );
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
