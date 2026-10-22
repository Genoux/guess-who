import { describe, expect, it } from "vitest";
import { stickerModeFor } from "./sticker-mode";

const base = { locked: false, ruled: false, shortlisted: false, welcomer: null };

describe("stickerModeFor", () => {
  it("keeps uncollected stickers locked, even on the maybe list", () => {
    expect(stickerModeFor({ ...base, locked: true })).toBe("locked");
    expect(stickerModeFor({ ...base, locked: true, shortlisted: true })).toBe("locked");
  });

  it("shows a collected sticker", () => {
    expect(stickerModeFor(base)).toBe("collected");
  });

  it("marks the maybe list", () => {
    expect(stickerModeFor({ ...base, shortlisted: true })).toBe("maybe");
  });

  it("puts a ruled out person above the maybe list", () => {
    expect(stickerModeFor({ ...base, ruled: true, shortlisted: true })).toBe("ruled");
  });

  it("stamps the welcomer found once the player found them", () => {
    expect(stickerModeFor({ ...base, welcomer: "found", shortlisted: true })).toBe("found");
  });

  it("opens the revealed welcomer without the found stamp", () => {
    expect(stickerModeFor({ ...base, locked: true, welcomer: "revealed" })).toBe("collected");
  });
});
