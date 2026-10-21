import {
  appUrlEnv,
  clerkClientEnv,
  clerkServerEnv,
  csv,
  dbEnv,
  sentryClientEnv,
  upstashEnv,
} from "@inbeat/core/env";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ...appUrlEnv,
    ...dbEnv,
    ...clerkServerEnv,
    ...upstashEnv,
    // Who may sign in without an invite (an admin-created person or game).
    ALLOWED_EMAIL_DOMAINS: csv().optional().default(["inbeat.agency"]),
  },
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },
  client: {
    ...sentryClientEnv,
    ...clerkClientEnv,
    NEXT_PUBLIC_VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
