import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Deel signs `"POST" + raw body` with the subscription's signing key (developer.deel.com/api/webhooks/quickstart). */
export function verifyDeelSignature(
  rawBody: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`POST${rawBody}`).digest("hex"));
  const received = Buffer.from(signature.toLowerCase());
  return received.length === expected.length && timingSafeEqual(received, expected);
}
