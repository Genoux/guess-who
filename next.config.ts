import { clerkFrontendApi, securityHeaders } from "@inbeat/next/security-headers";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@inbeat/ui"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders({
        clerkFrontendApi: clerkFrontendApi(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
        dev: process.env.NODE_ENV !== "production",
      }),
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Browser events go through this rewrite so ad-blockers don't drop them; the proxy matcher
  // must never catch it.
  tunnelRoute: "/monitoring",
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
