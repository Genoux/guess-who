import "server-only";
import { z } from "zod";

const resourceSchema = z.record(z.string(), z.unknown());

const deelWebhookEnvelopeSchema = z.object({
  data: z.object({
    meta: z.object({
      event_type: z.string().min(1),
      organization_id: z.string().nullish(),
    }),
    resource: z.union([resourceSchema, z.array(resourceSchema)]),
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
    resource: Array.isArray(resource) ? (resource[0] ?? {}) : resource,
  };
}

export type DeelSubject = { kind: "person" | "contract"; id: string };

// Ids per event type are pinned in engram `integrations/deel-webhooks`: worker events carry the
// person id, contract and employee events a contract id.
const PERSON_EVENTS = new Set(["worker.v2.created", "worker.v2.updated", "worker.v2.deleted"]);
const CONTRACT_EVENTS = /^(contract\.status\.updated|contract\.terminated|employee\.created\..+)$/;

export function deelSubjectOf({ eventType, resource }: DeelWebhookEvent): DeelSubject | null {
  const id = typeof resource.id === "string" && resource.id ? resource.id : null;
  if (!id) return null;
  if (PERSON_EVENTS.has(eventType)) return { kind: "person", id };
  return CONTRACT_EVENTS.test(eventType) ? { kind: "contract", id } : null;
}
