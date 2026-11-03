import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ authorizeAdmin: vi.fn() }));
vi.mock("@/shared/lib/auth", () => auth);
const viewerPerson = vi.hoisted(() => ({ syncViewerPerson: vi.fn() }));
vi.mock("@/shared/lib/viewer-person", () => viewerPerson);

import { authorizeAdminPerson } from "./authorize-admin-person";

beforeEach(() => {
  vi.clearAllMocks();
  auth.authorizeAdmin.mockResolvedValue({ userId: "user_1", sessionId: "sess_1", role: "admin" });
  viewerPerson.syncViewerPerson.mockResolvedValue({ id: "person_1" });
});

describe("authorizeAdminPerson", () => {
  it("returns the admin with their people id, created on first use", async () => {
    await expect(authorizeAdminPerson()).resolves.toEqual({
      userId: "user_1",
      sessionId: "sess_1",
      role: "admin",
      personId: "person_1",
    });
    expect(viewerPerson.syncViewerPerson).toHaveBeenCalledWith("user_1", "sess_1");
  });

  it("denies a member before reading any person", async () => {
    auth.authorizeAdmin.mockRejectedValueOnce(new AppError("forbidden", "admin role required"));
    await expect(authorizeAdminPerson()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
    expect(viewerPerson.syncViewerPerson).not.toHaveBeenCalled();
  });
});
