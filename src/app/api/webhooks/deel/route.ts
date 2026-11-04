import { AppError, classifyError } from "@inbeat/core/errors";
import { captureAppError } from "@inbeat/next/capture";
import { clientIp } from "@inbeat/next/rate-limit";
import { route } from "@inbeat/next/route";
import { syncDeelPersonRecord } from "@/features/games/server/sync-deel-person-record";
import { createDeelClient } from "@/integrations/deel/deel-client";
import { deelSubjectOf, parseDeelWebhookEvent } from "@/integrations/deel/deel-webhook-event";
import { verifyDeelSignature } from "@/integrations/deel/verify-deel-signature";
import { env } from "@/shared/config/env";
import { logger } from "@/shared/lib/logger";
import { rateLimiter } from "@/shared/lib/rate-limit";

const SIGNATURE_HEADER = "x-deel-signature";

// Deel disables a webhook after ten failed retries, so only transient failures answer non-2xx.
const isTransient = (error: unknown) => {
  const { kind, isRetryable } = classifyError(error);
  return isRetryable || kind === "timeout" || kind === "db_transient";
};

const received = (outcome: string, eventType?: string) => {
  logger.info("deel webhook", { eventType, outcome });
  return { received: true, outcome };
};

export const POST = route({
  name: "webhooks.deel",
  authorize: async (request) => {
    await rateLimiter.enforce(`deel-webhook:${clientIp(request.headers)}`, {
      limit: 120,
      window: "1 m",
    });
    return null;
  },
  handler: async ({ request }) => {
    const rawBody = await request.text();
    if (
      !verifyDeelSignature(rawBody, request.headers.get(SIGNATURE_HEADER), env.DEEL_WEBHOOK_SECRET)
    ) {
      logger.error("deel webhook signature rejected");
      throw new AppError("auth", "deel webhook signature rejected");
    }

    const event = parseDeelWebhookEvent(rawBody);
    if (!event) return received("unreadable event");
    const { eventType } = event;
    if (env.DEEL_ORGANIZATION_ID && event.organizationId !== env.DEEL_ORGANIZATION_ID) {
      return received("other organization", eventType);
    }
    const subject = deelSubjectOf(event);
    if (!subject) return received("unhandled event", eventType);

    try {
      if (!env.DEEL_API_TOKEN) throw new AppError("external_service", "DEEL_API_TOKEN is not set");
      const deel = createDeelClient({ baseUrl: env.DEEL_API_URL, token: env.DEEL_API_TOKEN });
      return received(await syncDeelPersonRecord({ deel, subject, now: new Date() }), eventType);
    } catch (error) {
      if (isTransient(error)) throw error;
      captureAppError(error, { tags: { route: "webhooks.deel" } });
      logger.error("deel webhook failed", { eventType, subjectId: subject.id });
      return { received: true, outcome: "failed" };
    }
  },
});
