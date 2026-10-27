import { describe, expect, it } from "vitest";
import { cardUrl } from "./card-url";

describe("cardUrl", () => {
  it("adds the open card to the page", () => {
    expect(cardUrl("/play", "", "abc")).toBe("/play?card=abc");
  });

  it("keeps the other search params", () => {
    expect(cardUrl("/play", "team=creative", "abc")).toBe("/play?team=creative&card=abc");
  });

  it("replaces a card that is already open", () => {
    expect(cardUrl("/play", "card=old", "abc")).toBe("/play?card=abc");
  });

  it("drops the card on close and leaves no empty query", () => {
    expect(cardUrl("/play", "card=abc", null)).toBe("/play");
  });

  it("drops only the card on close", () => {
    expect(cardUrl("/play", "team=creative&card=abc", null)).toBe("/play?team=creative");
  });
});
