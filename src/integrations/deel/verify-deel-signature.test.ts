import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDeelSignature } from "./verify-deel-signature";

const secret = "test-signing-key";
const body = JSON.stringify({ data: { meta: { event_type: "worker.v2.updated" } } });
const sign = (payload: string, key = secret) =>
  createHmac("sha256", key).update(`POST${payload}`).digest("hex");

describe("verifyDeelSignature", () => {
  it("accepts the hex HMAC of POST plus the raw body", () => {
    expect(verifyDeelSignature(body, sign(body), secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyDeelSignature(`${body} `, sign(body), secret)).toBe(false);
  });

  it("rejects a signature made with another secret", () => {
    expect(verifyDeelSignature(body, sign(body, "other"), secret)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyDeelSignature(body, null, secret)).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    expect(verifyDeelSignature(body, sign(body).slice(2), secret)).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(verifyDeelSignature(body, sign(body, ""), undefined)).toBe(false);
  });
});
