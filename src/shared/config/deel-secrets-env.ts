import { z } from "zod";

/** Without them production cannot sync or accept webhooks, so a deploy missing them must fail. */
export const deelSecretsEnv = (vercelEnv: string | undefined) => {
  const secret = z.string().min(1);
  const secretInProduction = vercelEnv === "production" ? secret : secret.optional();
  return { DEEL_API_TOKEN: secretInProduction, DEEL_WEBHOOK_SECRET: secretInProduction };
};
