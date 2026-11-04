import { describe, expect, it } from "vitest";
import { deelSubjectOf, parseDeelWebhookEvent } from "./deel-webhook-event";

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

describe("parseDeelWebhookEvent resource", () => {
  it("takes the first entry when the resource is an array", () => {
    const withArray = {
      data: { meta: { event_type: "worker.v2.created" }, resource: [{ id: "a" }, { id: "b" }] },
    };
    expect(parseDeelWebhookEvent(JSON.stringify(withArray))?.resource).toEqual({ id: "a" });
  });
});

describe("deelSubjectOf", () => {
  const event = (eventType: string, resource: Record<string, unknown>) => ({
    eventType,
    organizationId: null,
    resource,
  });

  it.each(["worker.v2.created", "worker.v2.updated", "worker.v2.deleted"])(
    "reads a person id from %s",
    (eventType) => {
      expect(deelSubjectOf(event(eventType, { id: "p1" }))).toEqual({ kind: "person", id: "p1" });
    },
  );

  it.each(["contract.status.updated", "contract.terminated", "employee.created.contractor"])(
    "reads a contract id from %s",
    (eventType) => {
      expect(deelSubjectOf(event(eventType, { id: "3072cm7" }))).toEqual({
        kind: "contract",
        id: "3072cm7",
      });
    },
  );

  it("is null for other events and for a missing id", () => {
    expect(deelSubjectOf(event("onboarding.status.updated", { id: "x" }))).toBeNull();
    expect(deelSubjectOf(event("worker.v2.updated", {}))).toBeNull();
    expect(deelSubjectOf(event("worker.v2.updated", { id: 7 }))).toBeNull();
  });
});
