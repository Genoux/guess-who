import { describe, expect, it } from "vitest";
import type { Person } from "@/db/schema";
import type { BoardSticker } from "./load-player-board";
import { toStickerDetail } from "./to-sticker-detail";
import { toStickerPerson } from "./to-sticker-person";
import { toStickerView } from "./to-sticker-view";

const person: Person = {
  id: "teammate",
  clerkUserId: "user_teammate",
  email: "teammate@inbeat.agency",
  name: "Sam Taylor",
  teamId: "team_ops",
  location: "Montréal secret city",
  fact: "Visited 40 countries",
  ask: "Ask me about night trains",
  imageUrl: "https://img.clerk.com/teammate",
  photoKey: "people/teammate.jpg",
  slackUserId: null,
  syncedSessionId: null,
  stickerNumber: 7,
  hidden: false,
  newHire: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const boardSticker = (unlocked: boolean, overrides: Partial<BoardSticker> = {}): BoardSticker => {
  const view = toStickerView(person, {
    personId: "player",
    collectedPersonIds: new Set(unlocked ? [person.id] : []),
  });
  return {
    id: person.id,
    teamId: person.teamId,
    name: person.name,
    firstName: "Sam",
    person: toStickerPerson(view, undefined),
    mode: unlocked ? "collected" : "locked",
    collected: unlocked,
    shortlisted: false,
    ruled: false,
    note: unlocked ? "Loves night trains" : null,
    ...overrides,
  };
};

describe("toStickerDetail", () => {
  it("keeps what the detail needs and drops the rest of the board row", () => {
    expect(toStickerDetail(boardSticker(true, { shortlisted: true }))).toEqual({
      id: "teammate",
      firstName: "Sam",
      person: boardSticker(true).person,
      mode: "collected",
      collected: true,
      shortlisted: true,
      ruled: false,
      note: "Loves night trains",
    });
  });

  it("sends a locked sticker without its fact, city, photo or note", () => {
    const sent = JSON.stringify(toStickerDetail(boardSticker(false)));
    for (const secret of ["Visited 40", "secret city", "img.clerk.com", "teammate@", "Loves"]) {
      expect(sent).not.toContain(secret);
    }
    expect(toStickerDetail(boardSticker(false)).note).toBeNull();
  });
});
