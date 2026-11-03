import { describe, expect, it } from "vitest";
import { parseDeelWebhookEvent } from "./deel-webhook-event";

const envelope = {
  data: {
    meta: { event_type: "worker.v2.updated", organization_id: "org-1" },
    resource: { id: "seed-person-1" },
  },
  timestamp: "2026-01-01T00:00:00.000Z",
};

describe("parseDeelWebhookEvent", () => {
  it("reads the event type, organization and resource", () => {
    expect(parseDeelWebhookEvent(JSON.stringify(envelope))).toEqual({
      eventType: "worker.v2.updated",
      organizationId: "org-1",
      resource: { id: "seed-person-1" },
    });
  });

  it("keeps the organization optional", () => {
    const withoutOrganization = {
      data: { meta: { event_type: "contract.terminated" }, resource: {} },
    };
    expect(parseDeelWebhookEvent(JSON.stringify(withoutOrganization))?.organizationId).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseDeelWebhookEvent("{nope")).toBeNull();
  });

  it("returns null when the envelope has no event type", () => {
    expect(parseDeelWebhookEvent(JSON.stringify({ data: { meta: {}, resource: {} } }))).toBeNull();
  });
});
