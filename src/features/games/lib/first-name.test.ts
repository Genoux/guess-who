import { describe, expect, it } from "vitest";
import { firstName } from "./first-name";

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Ana Ferreira")).toBe("Ana");
    expect(firstName("  Léa   Dubois ")).toBe("Léa");
  });

  it("keeps a single name", () => {
    expect(firstName("Cher")).toBe("Cher");
  });
});
