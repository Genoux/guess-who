import { describe, expect, it } from "vitest";
import {
  formatStickerNumber,
  getStickerView,
  type StickerPerson,
  stickerCelebration,
} from "./sticker-view";

const noor: StickerPerson = {
  name: "Noor Haddad",
  number: 4,
  team: "Creative",
  color: "#46BDF0",
  tint: "#B5E5F9",
  ask: "The best bakery in any city",
  city: "Toronto",
  fact: "Once won a pie-eating contest by accident.",
};

describe("formatStickerNumber", () => {
  it("pads single digits", () => {
    expect(formatStickerNumber(4)).toBe("04");
    expect(formatStickerNumber("7")).toBe("07");
  });

  it("leaves longer numbers alone", () => {
    expect(formatStickerNumber(21)).toBe("21");
    expect(formatStickerNumber("004")).toBe("004");
  });
});

describe("getStickerView", () => {
  it("keeps a locked sticker closed with the team", () => {
    const view = getStickerView(noor, "locked", "lg");
    expect(view.open).toBe(false);
    expect(view.stamp).toBeNull();
    expect(view.showMore).toBe(false);
    expect(view.subtitle).toBe("Creative");
    expect(view).not.toHaveProperty("number");
  });

  it("adds the city on a large open sticker only", () => {
    expect(getStickerView(noor, "collected", "lg").subtitle).toBe("Creative · Toronto");
    expect(getStickerView(noor, "collected", "sm").subtitle).toBe("Creative");
    expect(getStickerView({ ...noor, city: null }, "collected", "lg").subtitle).toBe("Creative");
  });

  it("keeps the team on a ruled out sticker; the badge says not them", () => {
    const view = getStickerView(noor, "ruled", "sm");
    expect(view.open).toBe(true);
    expect(view.stamp).toBe("ruled");
    expect(view.subtitle).toBe("Creative");
  });

  it("maps maybe and found to their stamps", () => {
    expect(getStickerView(noor, "maybe", "sm").stamp).toBe("maybe");
    expect(getStickerView(noor, "found", "sm").stamp).toBe("found");
    expect(getStickerView(noor, "collected", "sm").stamp).toBeNull();
  });

  it("shows the fact block on large open stickers", () => {
    expect(getStickerView(noor, "found", "lg").showMore).toBe(true);
    expect(getStickerView(noor, "found", "sm").showMore).toBe(false);
  });

  it("builds initials and picks a readable tone for the fallback", () => {
    const view = getStickerView(noor, "collected", "sm");
    expect(view.initials).toBe("NH");
    expect(view.initialsTone).toBe("ink");
    expect(getStickerView({ ...noor, color: "#157428" }, "collected", "sm").initialsTone).toBe(
      "white",
    );
    expect(getStickerView({ ...noor, name: "  " }, "collected", "sm").initials).toBe("?");
  });
});

describe("stickerCelebration", () => {
  it("celebrates an unlock", () => {
    expect(stickerCelebration("locked", "collected")).toBe("unlock");
    expect(stickerCelebration("locked", "maybe")).toBe("unlock");
  });

  it("celebrates finding the welcomer from any mode", () => {
    expect(stickerCelebration("maybe", "found")).toBe("found");
    expect(stickerCelebration("locked", "found")).toBe("found");
  });

  it("stays quiet otherwise", () => {
    expect(stickerCelebration("collected", "collected")).toBeNull();
    expect(stickerCelebration("collected", "maybe")).toBeNull();
    expect(stickerCelebration("maybe", "ruled")).toBeNull();
    expect(stickerCelebration("collected", "locked")).toBeNull();
  });
});
