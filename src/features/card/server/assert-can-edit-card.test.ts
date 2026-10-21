import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanEditCard } from "./assert-can-edit-card";

describe("assertCanEditCard", () => {
  it("lets someone who never played edit as a teammate", () => {
    expect(assertCanEditCard([])).toBe("teammate");
  });

  it("lets a player whose game ended make their card as a new hire", () => {
    expect(assertCanEditCard(["found"])).toBe("new-hire");
    expect(assertCanEditCard(["revealed"])).toBe("new-hire");
  });

  it("forbids a player while any of their games is active", () => {
    expect(() => assertCanEditCard(["active"])).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
    expect(() => assertCanEditCard(["revealed", "active"])).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
  });
});
