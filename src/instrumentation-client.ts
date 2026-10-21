import { sentryClientOptions } from "@inbeat/next/sentry-client";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";

Sentry.init(
  sentryClientOptions({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    // Dev and E2E fixture failures would otherwise trip the new-issue alert.
    enabled: process.env.NODE_ENV === "production",
    environment: env.NEXT_PUBLIC_VERCEL_ENV,
  }),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
