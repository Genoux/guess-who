import { sentryServerOptions } from "@inbeat/next/sentry";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";

Sentry.init({
  ...sentryServerOptions({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: process.env.NODE_ENV === "production",
    environment: env.VERCEL_ENV,
  }),
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],
});
