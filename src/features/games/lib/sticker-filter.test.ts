import { describe, expect, it } from "vitest";
import { matchesStickerFilter } from "./sticker-filter";

const locked = { mode: "locked", collected: false } as const;
const collected = { mode: "collected", collected: true } as const;
const maybe = { mode: "maybe", collected: true } as const;
const ruled = { mode: "ruled", collected: true } as const;
const revealedWelcomer = { mode: "collected", collected: false } as const;

describe("matchesStickerFilter", () => {
  it("keeps everything for all", () => {
    expect([locked, collected, maybe, ruled].every((s) => matchesStickerFilter(s, "all"))).toBe(
      true,
    );
  });

  it("counts maybes and ruled out stickers as collected", () => {
    expect([collected, maybe, ruled].every((s) => matchesStickerFilter(s, "collected"))).toBe(true);
    expect(matchesStickerFilter(locked, "collected")).toBe(false);
  });

  it("leaves the revealed welcomer out of collected", () => {
    expect(matchesStickerFilter(revealedWelcomer, "collected")).toBe(false);
  });

  it.each([
    ["locked", locked],
    ["maybe", maybe],
    ["ruled", ruled],
  ] as const)("matches %s by mode only", (filter, sticker) => {
    expect(matchesStickerFilter(sticker, filter)).toBe(true);
    expect(matchesStickerFilter(collected, filter)).toBe(false);
  });
});
