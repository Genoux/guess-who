import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { AppEventEnvelope } from "@/entities/app-events";

const REQUEST_TIMEOUT_MS = 5_000;
// A fixed secret rather than an HMAC of the body: n8n's Webhook node checks a header natively
// (Header Auth credential), while an HMAC needs a Code node over the exact raw body.
export const SECRET_HEADER = "x-album-secret";
export const EVENT_HEADER = "x-album-event";

type N8nEventClientOptions = {
  webhookUrl: string;
  secret: string;
  fetchImpl?: typeof fetch;
};

export function createN8nEventClient({
  webhookUrl,
  secret,
  fetchImpl = fetch,
}: N8nEventClientOptions) {
  async function send(envelope: AppEventEnvelope): Promise<void> {
    const body = JSON.stringify(envelope);
    let response: Response;
    try {
      response = await fetchImpl(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [EVENT_HEADER]: envelope.type,
          [SECRET_HEADER]: secret,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new AppError("external_service", "n8n request failed", {
        cause: error,
        isRetryable: true,
      });
    }
    if (!response.ok) {
      throw new AppError("external_service", `n8n answered ${response.status}`, {
        isRetryable: response.status >= 500 || response.status === 429,
      });
    }
  }

  return { send };
}
