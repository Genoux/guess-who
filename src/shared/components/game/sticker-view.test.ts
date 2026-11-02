import { describe, expect, it } from "vitest";
import {
  formatStickerNumber,
  getAskTextStep,
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
    const view = getStickerView(noor, "locked");
    expect(view.open).toBe(false);
    expect(view.stamp).toBeNull();
    expect(view.subtitle).toBe("Creative");
    expect(view).not.toHaveProperty("number");
  });

  it("adds the city to the team once the card is open", () => {
    expect(getStickerView(noor, "collected").subtitle).toBe("Creative · Toronto");
    expect(getStickerView(noor, "ruled").subtitle).toBe("Creative · Toronto");
    expect(getStickerView({ ...noor, city: null }, "collected").subtitle).toBe("Creative");
    expect(getStickerView({ ...noor, city: "  " }, "collected").subtitle).toBe("Creative");
  });

  it("stamps a found sticker as found, open", () => {
    const view = getStickerView(noor, "found");
    expect(view.open).toBe(true);
    expect(view.stamp).toBe("found");
  });

  it("stamps the tour's welcomer as welcomer, open", () => {
    const view = getStickerView(noor, "welcomer");
    expect(view.open).toBe(true);
    expect(view.stamp).toBe("welcomer");
  });

  it("keeps the team on a ruled out sticker; the badge says not them", () => {
    const view = getStickerView(noor, "ruled");
    expect(view.open).toBe(true);
    expect(view.stamp).toBe("ruled");
  });

  it("maps maybe to its stamp", () => {
    expect(getStickerView(noor, "maybe").stamp).toBe("maybe");
    expect(getStickerView(noor, "collected").stamp).toBeNull();
  });

  it("builds initials for the fallback", () => {
    const view = getStickerView(noor, "collected");
    expect(view.initials).toBe("NH");
    expect(view).not.toHaveProperty("initialsTone");
    expect(getStickerView({ ...noor, name: "  " }, "collected").initials).toBe("?");
  });
});

describe("stickerCelebration", () => {
  it("celebrates an unlock", () => {
    expect(stickerCelebration("locked", "collected")).toBe("unlock");
    expect(stickerCelebration("locked", "maybe")).toBe("unlock");
  });

  it("stays quiet otherwise", () => {
    expect(stickerCelebration("collected", "collected")).toBeNull();
    expect(stickerCelebration("collected", "maybe")).toBeNull();
    expect(stickerCelebration("maybe", "ruled")).toBeNull();
    expect(stickerCelebration("collected", "locked")).toBeNull();
  });
});

describe("getAskTextStep", () => {
  it("steps the small sticker's ask down early, as its box is short", () => {
    expect(getAskTextStep("Night trains", "sm")).toBe("large");
    expect(getAskTextStep("x".repeat(16), "sm")).toBe("large");
    expect(getAskTextStep("x".repeat(17), "sm")).toBe("medium");
    expect(getAskTextStep("x".repeat(32), "sm")).toBe("medium");
    expect(getAskTextStep("x".repeat(33), "sm")).toBe("small");
    expect(getAskTextStep("x".repeat(55), "sm")).toBe("small");
  });

  it("keeps the large sticker's ask big up to 32 characters", () => {
    expect(getAskTextStep("x".repeat(32), "lg")).toBe("large");
    expect(getAskTextStep("x".repeat(33), "lg")).toBe("medium");
    expect(getAskTextStep("x".repeat(57), "lg")).toBe("small");
  });

  it("measures the text as written, not the padding around it", () => {
    expect(getAskTextStep(`  ${"x".repeat(16)}  `, "sm")).toBe("large");
  });
});
