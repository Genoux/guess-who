import { describe, expect, it } from "vitest";
import type { Person } from "@/db/schema";
import { toStickerView } from "./to-sticker-view";

const person: Person = {
  id: "teammate",
  clerkUserId: "user_teammate",
  email: "teammate@inbeat.agency",
  name: "Sam Taylor",
  teamId: "team_ops",
  location: "Montréal",
  fact: "Visited 40 countries",
  ask: "Ask me about night trains",
  photoKey: "people/teammate.jpg",
  stickerNumber: 7,
  hidden: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const LOCKED_FIELDS = ["fact", "location", "photoKey"];
const PRIVATE_FIELDS = ["email", "clerkUserId", "hidden", "createdAt", "updatedAt"];

describe("toStickerView", () => {
  it("locks fact, location and photo for a player who has not collected the sticker", () => {
    const view = toStickerView(person, { personId: "player", collectedPersonIds: new Set() });
    expect(view).toEqual({
      id: "teammate",
      name: "Sam Taylor",
      teamId: "team_ops",
      stickerNumber: 7,
      ask: "Ask me about night trains",
      locked: true,
    });
    for (const field of LOCKED_FIELDS) expect(view).not.toHaveProperty(field);
  });

  it("unlocks the sticker once the player collected it", () => {
    const view = toStickerView(person, {
      personId: "player",
      collectedPersonIds: new Set(["teammate"]),
    });
    expect(view).toMatchObject({
      locked: false,
      fact: "Visited 40 countries",
      location: "Montréal",
      photoKey: "people/teammate.jpg",
    });
  });

  it("unlocks the viewer's own sticker", () => {
    const view = toStickerView(person, { personId: "teammate", collectedPersonIds: new Set() });
    expect(view.locked).toBe(false);
  });

  it("unlocks every sticker for a viewer who is not playing a game", () => {
    const view = toStickerView(person, { personId: "someone", collectedPersonIds: null });
    expect(view.locked).toBe(false);
  });

  it("never returns private fields", () => {
    for (const collectedPersonIds of [null, new Set<string>(), new Set(["teammate"])]) {
      const view = toStickerView(person, { personId: "player", collectedPersonIds });
      for (const field of PRIVATE_FIELDS) expect(view).not.toHaveProperty(field);
    }
  });
});
