import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ authorizeMember: vi.fn() }));
vi.mock("@/shared/lib/auth", () => auth);
const viewerPerson = vi.hoisted(() => ({ syncViewerPerson: vi.fn() }));
vi.mock("@/shared/lib/viewer-person", () => viewerPerson);
const access = vi.hoisted(() => ({ assertCardUnlocked: vi.fn() }));
vi.mock("@/shared/lib/card-access", () => access);

import { authorizeClueWriter } from "./authorize-clue-writer";

const person = { id: "person_1", teamId: null, ask: null };

beforeEach(() => {
  vi.clearAllMocks();
  auth.authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "sess_1", role: "member" });
  viewerPerson.syncViewerPerson.mockResolvedValue(person);
  access.assertCardUnlocked.mockResolvedValue(undefined);
});

describe("authorizeClueWriter", () => {
  it("returns the teammate with their own people id once the clues are open to them", async () => {
    await expect(authorizeClueWriter()).resolves.toMatchObject({ personId: "person_1" });
    expect(access.assertCardUnlocked).toHaveBeenCalledWith(person);
  });

  it("refuses a new hire who has not finished their mission", async () => {
    access.assertCardUnlocked.mockRejectedValueOnce(
      new AppError("forbidden", "closed", { safeMessage: "Finish your mission first." }),
    );
    await expect(authorizeClueWriter()).rejects.toSatisfy(
      (err) => isAppError(err, "forbidden") && err.safeMessage === "Finish your mission first.",
    );
  });

  it("denies a visitor without a session before reading any person", async () => {
    auth.authorizeMember.mockRejectedValueOnce(new AppError("auth", "no session"));
    await expect(authorizeClueWriter()).rejects.toSatisfy((err) => isAppError(err, "auth"));
    expect(viewerPerson.syncViewerPerson).not.toHaveBeenCalled();
  });
});
