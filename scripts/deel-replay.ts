// Dev helper: signs a sample Deel event with DEEL_WEBHOOK_SECRET and POSTs it to a webhook URL.
// Ids are fake; point --id at a real Deel person or contract id to exercise the sync.
//
//   bun run deel:replay -- worker.v2.updated --id <person uuid>
//   bun run deel:replay -- contract.terminated --id <contract id> --url https://preview.example/api/webhooks/deel
import { createHmac } from "node:crypto";
import { parseArgs } from "node:util";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    id: { type: "string", default: "00000000-0000-4000-8000-000000000001" },
    url: { type: "string", default: "http://localhost:3000/api/webhooks/deel" },
  },
});

const secret = process.env.DEEL_WEBHOOK_SECRET;
if (!secret) throw new Error("DEEL_WEBHOOK_SECRET is not set");

const eventType = positionals[0] ?? "worker.v2.updated";
const body = JSON.stringify({
  data: {
    meta: {
      event_type: eventType,
      organization_id: process.env.DEEL_ORGANIZATION_ID ?? "fake-organization",
      tracking_id: "fake-tracking-id",
    },
    resource: eventType.startsWith("worker.") ? { id: values.id } : [{ id: values.id }],
  },
  timestamp: new Date().toISOString(),
});

const response = await fetch(values.url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-deel-signature": createHmac("sha256", secret).update(`POST${body}`).digest("hex"),
  },
  body,
});
console.info(response.status, await response.text());
