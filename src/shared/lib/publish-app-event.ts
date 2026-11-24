import "server-only";
import { after } from "next/server";
import { notifications } from "@/db/schema";
import { APP_EVENT_SCHEMAS, type AppEventData, type AppEventType } from "@/entities/app-events";
import type { DbTransaction } from "./db";
import { dispatchPendingAppEvents } from "./dispatch-app-events";
import { logger } from "./logger";

/**
 * Records an event in the caller's transaction, so it exists exactly when the change it reports
 * commits, and sends it once the response is out. A send that fails stays pending for the next
 * dispatch.
 */
export async function publishAppEvent<Type extends AppEventType>(
  tx: DbTransaction,
  type: Type,
  data: AppEventData<Type>,
): Promise<void> {
  const payload = APP_EVENT_SCHEMAS[type].parse(data);
  await tx.insert(notifications).values({ type, payload });
  after(async () => {
    try {
      await dispatchPendingAppEvents();
    } catch (error) {
      logger.error("app event dispatch failed", {
        type,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
