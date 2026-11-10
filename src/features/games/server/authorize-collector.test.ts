import { AppError, isAppError } from "@inbeat/core/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ authorizeMember: vi.fn() }));
vi.mock("@/shared/lib/auth", () => auth);
const viewerPerson = vi.hoisted(() => ({ syncViewerPerson: vi.fn() }));
vi.mock("@/shared/lib/viewer-person", () => viewerPerson);
const records = vi.hoisted(() => ({ findLatestPlayerGame: vi.fn() }));
vi.mock("./game-records", () => records);

import { authorizeCollector } from "./authorize-collector";

const running = { status: "active", welcomerPersonId: "ana", startDate: "2026-10-26" };

// Day 3 of `running`: with the real clock the mission would expire and the test with it.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-28T15:00:00Z") });
  vi.clearAllMocks();
  auth.authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "sess_1", role: "member" });
  viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1", newHire: false });
  records.findLatestPlayerGame.mockResolvedValue(undefined);
});

afterEach(() => vi.useRealTimers());

describe("authorizeCollector", () => {
  it("returns the signed-in teammate with their own people id", async () => {
    await expect(authorizeCollector()).resolves.toMatchObject({ personId: "person_1" });
    expect(viewerPerson.syncViewerPerson).toHaveBeenCalledWith("user_1", "sess_1");
  });

  it("lets a teammate who is not a new hire collect with no mission", async () => {
    await expect(authorizeCollector()).resolves.toMatchObject({ personId: "person_1" });
  });

  it("lets a new hire with a running mission keep collecting", async () => {
    viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1", newHire: true });
    records.findLatestPlayerGame.mockResolvedValue(running);
    await expect(authorizeCollector()).resolves.toMatchObject({ personId: "person_1" });
  });

  it("refuses a new hire with no mission, with the reason", async () => {
    viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1", newHire: true });
    await expect(authorizeCollector()).rejects.toSatisfy(
      (err) => isAppError(err, "forbidden") && err.safeMessage === "Finish your mission first.",
    );
  });

  it("refuses a new hire whose only mission is over", async () => {
    viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1", newHire: true });
    records.findLatestPlayerGame.mockResolvedValue({ ...running, status: "revealed" });
    await expect(authorizeCollector()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });

  it("denies a visitor without a session before reading any person", async () => {
    auth.authorizeMember.mockRejectedValueOnce(new AppError("auth", "no session"));
    await expect(authorizeCollector()).rejects.toSatisfy((err) => isAppError(err, "auth"));
    expect(viewerPerson.syncViewerPerson).not.toHaveBeenCalled();
  });
});
