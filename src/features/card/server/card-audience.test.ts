import { describe, expect, it } from "vitest";
import { cardAudience } from "./card-audience";

describe("cardAudience", () => {
  it("treats someone with no finished mission as a teammate, mission or not", () => {
    expect(cardAudience([])).toBe("teammate");
    expect(cardAudience(["active"])).toBe("teammate");
  });

  it("lets a player whose mission ended make their card as a player", () => {
    expect(cardAudience(["found"])).toBe("new-hire");
    expect(cardAudience(["revealed"])).toBe("new-hire");
  });
});
