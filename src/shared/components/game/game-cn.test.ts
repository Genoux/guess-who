import { describe, expect, it } from "vitest";
import { gameCn } from "./game-cn";

describe("gameCn", () => {
  it("keeps a game font size next to a game text color", () => {
    expect(gameCn("text-hero", "text-game-muted")).toBe("text-hero text-game-muted");
  });

  it("lets the later game token of the same group win", () => {
    expect(gameCn("rounded-sticker", "rounded-sticker-lg")).toBe("rounded-sticker-lg");
    expect(gameCn("shadow-ink", "shadow-edge")).toBe("shadow-edge");
    expect(gameCn("font-game-sans", "font-game-serif")).toBe("font-game-serif");
  });

  it("drops falsy values", () => {
    expect(gameCn("flex", false, undefined, "gap-2")).toBe("flex gap-2");
  });
});
