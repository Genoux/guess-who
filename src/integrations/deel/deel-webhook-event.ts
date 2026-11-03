import "server-only";
import { z } from "zod";

const deelWebhookEnvelopeSchema = z.object({
  data: z.object({
    meta: z.object({
      event_type: z.string().min(1),
      organization_id: z.string().nullish(),
    }),
    resource: z.record(z.string(), z.unknown()),
  }),
});

export type DeelWebhookEvent = {
  eventType: string;
  organizationId: string | null;
  resource: Record<string, unknown>;
};

export function parseDeelWebhookEvent(rawBody: string): DeelWebhookEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const parsed = deelWebhookEnvelopeSchema.safeParse(json);
  if (!parsed.success) return null;
  const { meta, resource } = parsed.data.data;
  return {
    eventType: meta.event_type,
    organizationId: meta.organization_id ?? null,
    resource,
  };
}
