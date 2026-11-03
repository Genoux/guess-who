import { describe, expect, it } from "vitest";
import { isCatalogueEnabled } from "./catalogue-access";

describe("isCatalogueEnabled", () => {
  it("opens for local development", () => {
    expect(isCatalogueEnabled({ nodeEnv: "development" })).toBe(true);
  });

  it("opens on Vercel previews", () => {
    expect(isCatalogueEnabled({ nodeEnv: "production", vercelEnv: "preview" })).toBe(true);
  });

  it("stays closed in production", () => {
    expect(isCatalogueEnabled({ nodeEnv: "production", vercelEnv: "production" })).toBe(false);
  });

  it("stays closed when the variables are missing", () => {
    expect(isCatalogueEnabled({})).toBe(false);
    expect(isCatalogueEnabled({ nodeEnv: "production" })).toBe(false);
    expect(isCatalogueEnabled({ nodeEnv: "test", vercelEnv: "development" })).toBe(false);
  });
});
