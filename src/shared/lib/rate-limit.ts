import "server-only";
import { createRateLimiter } from "@inbeat/next/rate-limit";
import { env } from "@/shared/config/env";
import { logger } from "./logger";

/** One limiter for every action and route; Upstash in production, memory without its env. */
export const rateLimiter = createRateLimiter({
  prefix: "album",
  upstash: { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN },
  onMemoryFallback: () => logger.warn("rate limiter using memory, upstash env missing"),
});
