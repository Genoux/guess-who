import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ authorizeMember: vi.fn() }));
vi.mock("@/shared/lib/auth", () => auth);
const viewerPerson = vi.hoisted(() => ({ syncViewerPerson: vi.fn() }));
vi.mock("@/shared/lib/viewer-person", () => viewerPerson);

import { authorizeTeammate } from "./authorize-teammate";

beforeEach(() => {
  vi.clearAllMocks();
  auth.authorizeMember.mockResolvedValue({ userId: "user_1", sessionId: "sess_1", role: "member" });
  viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1" });
});

describe("authorizeTeammate", () => {
  it("returns the signed-in teammate with their own people id", async () => {
    await expect(authorizeTeammate()).resolves.toMatchObject({ personId: "person_1" });
    expect(viewerPerson.syncViewerPerson).toHaveBeenCalledWith("user_1", "sess_1");
  });

  it("denies a visitor without a session before reading any person", async () => {
    auth.authorizeMember.mockRejectedValueOnce(new AppError("auth", "no session"));
    await expect(authorizeTeammate()).rejects.toSatisfy((err) => isAppError(err, "auth"));
    expect(viewerPerson.syncViewerPerson).not.toHaveBeenCalled();
  });
});
