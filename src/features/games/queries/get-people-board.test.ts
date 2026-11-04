import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeAdmin: vi.fn(),
  getViewerPerson: vi.fn(),
  syncViewerPerson: vi.fn(),
  listPeople: vi.fn(),
  listGameActivity: vi.fn(),
  toPeopleBoard: vi.fn(),
}));
vi.mock("@/shared/lib/auth", () => ({ authorizeAdmin: mocks.authorizeAdmin }));
vi.mock("@/shared/lib/viewer-person", () => ({
  getViewerPerson: mocks.getViewerPerson,
  syncViewerPerson: mocks.syncViewerPerson,
}));
vi.mock("../server/people-records", () => ({
  listPeople: mocks.listPeople,
  listGameActivity: mocks.listGameActivity,
}));
vi.mock("../server/to-people-board", () => ({ toPeopleBoard: mocks.toPeopleBoard }));

import { getPeopleBoard } from "./get-people-board";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorizeAdmin.mockResolvedValue({ userId: "user_1", sessionId: "s1", role: "admin" });
  mocks.getViewerPerson.mockResolvedValue({ person: { id: "person_1" } });
  mocks.listPeople.mockResolvedValue([]);
  mocks.listGameActivity.mockResolvedValue([]);
  mocks.toPeopleBoard.mockReturnValue({ playing: [], noMission: [], done: [] });
});

describe("getPeopleBoard", () => {
  it("reads the admin's person through getViewerPerson, which sends an unlisted admin away", async () => {
    await getPeopleBoard();
    expect(mocks.getViewerPerson).toHaveBeenCalled();
    expect(mocks.syncViewerPerson).not.toHaveBeenCalled();
    expect(mocks.toPeopleBoard).toHaveBeenCalledWith(
      expect.objectContaining({ viewerPersonId: "person_1" }),
    );
  });

  it("lets the redirect for an unlisted admin through", async () => {
    mocks.getViewerPerson.mockRejectedValue(new Error("redirect /not-on-the-list"));
    await expect(getPeopleBoard()).rejects.toThrow("redirect /not-on-the-list");
  });
});
