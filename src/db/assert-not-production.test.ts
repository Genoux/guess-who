import { describe, expect, it } from "vitest";
import { assertNotProduction } from "./assert-not-production";

const production =
  "postgresql://u:p@ep-wandering-truth-a1b2c3-pooler.us-east-1.aws.neon.tech/album";
const dev = "postgresql://u:p@ep-small-dew-a1b2c3-pooler.us-east-1.aws.neon.tech/album";

describe("assertNotProduction", () => {
  it("allows a non-production endpoint", () => {
    expect(() => assertNotProduction(dev)).not.toThrow();
  });

  it("refuses the production endpoint", () => {
    expect(() => assertNotProduction(production)).toThrow(/production endpoint/);
  });

  it("refuses the production endpoint without the pooler suffix", () => {
    expect(() =>
      assertNotProduction("postgres://u:p@ep-wandering-truth-a1b2c3.us-east-1.aws.neon.tech/db"),
    ).toThrow(/production endpoint/);
  });

  it("allows production only when explicitly allowed", () => {
    expect(() => assertNotProduction(production, { allowProduction: true })).not.toThrow();
  });

  it.each([undefined, ""])("refuses a missing URL (%j)", (url) => {
    expect(() => assertNotProduction(url, { allowProduction: true })).toThrow(/not set/);
  });

  it("does not match the endpoint name outside the host", () => {
    expect(() =>
      assertNotProduction("postgresql://ep-wandering-truth:p@ep-small-dew.neon.tech/db"),
    ).not.toThrow();
  });
});
