import { describe, expect, it } from "vitest";
import { cardUrl, openingCardId } from "./card-url";

const ID = "3f2b8c1e-5d4a-4e7b-9c1d-2a6f8e0b7d11";
const OTHER_ID = "7a9d1c4e-2b3f-4a8e-8d5c-1e0f9b6a3c22";
const album = [
  { id: ID, mode: "collected" as const },
  { id: OTHER_ID, mode: "locked" as const },
];

describe("openingCardId", () => {
  it("opens a card that is in the album", () => {
    expect(openingCardId(ID, album)).toBe(ID);
  });

  it("ignores a missing param", () => {
    expect(openingCardId(undefined, album)).toBeNull();
  });

  it("ignores a repeated param", () => {
    expect(openingCardId([ID, ID], album)).toBeNull();
  });

  it("ignores anything that is not a uuid", () => {
    expect(openingCardId("not-an-id", album)).toBeNull();
    expect(openingCardId("", album)).toBeNull();
  });

  it("ignores an id that is not in the album", () => {
    expect(openingCardId("0b5e6d7f-1a2b-4c3d-8e4f-5a6b7c8d9e00", album)).toBeNull();
  });

  it("ignores a card that is not collected yet", () => {
    expect(openingCardId(OTHER_ID, album)).toBeNull();
  });
});

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
