import { z } from "zod";

/** Without them production records events but never delivers them, so a deploy missing them must fail. */
export const n8nEventsEnv = (vercelEnv: string | undefined) => {
  const inProduction = vercelEnv === "production";
  const webhookUrl = z.url();
  const secret = z.string().min(32);
  return {
    N8N_EVENTS_WEBHOOK_URL: inProduction ? webhookUrl : webhookUrl.optional(),
    N8N_EVENTS_SECRET: inProduction ? secret : secret.optional(),
  };
};
