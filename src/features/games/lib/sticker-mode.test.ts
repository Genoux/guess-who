import { describe, expect, it } from "vitest";
import { stickerModeFor } from "./sticker-mode";

const base = { locked: false, ruled: false, shortlisted: false, over: false };

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

  it("drops the maybe and not-them badges once the game is over", () => {
    expect(stickerModeFor({ ...base, over: true, shortlisted: true })).toBe("collected");
    expect(stickerModeFor({ ...base, over: true, ruled: true })).toBe("collected");
  });

  it("keeps uncollected stickers locked once the game is over", () => {
    expect(stickerModeFor({ ...base, over: true, locked: true })).toBe("locked");
  });
});
