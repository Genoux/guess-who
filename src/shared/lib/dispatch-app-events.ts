import "server-only";
import { AppError, isAppError } from "@inbeat/core/errors";
import { asc, eq, sql } from "drizzle-orm";
import { notifications } from "@/db/schema";
import { type AppEventEnvelope, isAppEventType } from "@/entities/app-events";
import { createN8nEventClient } from "@/integrations/n8n/n8n-event-client";
import { env } from "@/shared/config/env";
import { db } from "./db";
import { logger } from "./logger";

const BATCH_SIZE = 10;
export const MAX_DELIVERY_ATTEMPTS = 5;

type PendingEvent = typeof notifications.$inferSelect;
type EventSender = (envelope: AppEventEnvelope) => Promise<void>;

function toEnvelope({ id, type, payload, createdAt }: PendingEvent): AppEventEnvelope {
  if (!isAppEventType(type)) {
    throw new AppError("validation", `unknown app event type: ${type}`, { isRetryable: false });
  }
  return {
    id,
    type,
    occurredAt: createdAt.toISOString(),
    data: payload as AppEventEnvelope["data"],
  };
}

function deliveryFailure(error: unknown, attempts: number) {
  const retryable = !isAppError(error) || error.isRetryable !== false;
  const gaveUp = !retryable || attempts >= MAX_DELIVERY_ATTEMPTS;
  return {
    status: gaveUp ? ("failed" as const) : ("pending" as const),
    lastError: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Sends the oldest pending events to n8n, oldest first. Rows stay locked while they are sent, so
 * two dispatches running at once never send the same event; a failure leaves the row pending for
 * the next dispatch until it runs out of attempts.
 */
export async function dispatchPendingAppEvents(
  send: EventSender | null = defaultSender(),
): Promise<{ sent: number; failed: number }> {
  if (!send) return { sent: 0, failed: 0 };
  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(notifications)
      .where(eq(notifications.status, "pending"))
      .orderBy(asc(notifications.createdAt))
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });

    let sent = 0;
    let failed = 0;
    for (const event of pending) {
      const attempts = event.attempts + 1;
      try {
        await send(toEnvelope(event));
        await tx
          .update(notifications)
          .set({ status: "sent", attempts, lastError: null, sentAt: sql`now()` })
          .where(eq(notifications.id, event.id));
        sent++;
      } catch (error) {
        const failure = deliveryFailure(error, attempts);
        await tx
          .update(notifications)
          .set({ ...failure, attempts })
          .where(eq(notifications.id, event.id));
        failed++;
        logger.error("app event delivery failed", {
          eventId: event.id,
          type: event.type,
          attempts,
          status: failure.status,
        });
      }
    }
    return { sent, failed };
  });
}

// Previews and local runs have no webhook: events stay pending instead of reaching Slack.
function defaultSender(): EventSender | null {
  if (!env.N8N_EVENTS_WEBHOOK_URL || !env.N8N_EVENTS_SECRET) return null;
  return createN8nEventClient({
    webhookUrl: env.N8N_EVENTS_WEBHOOK_URL,
    secret: env.N8N_EVENTS_SECRET,
  }).send;
}
