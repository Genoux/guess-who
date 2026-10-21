---
name: ib-toolkit
description: Use the inBeat toolkit (@inbeat/core, @inbeat/next, @inbeat/config) correctly in an inBeat app. Use when writing server actions, route handlers, auth checks, env, rate limits, webhooks, Sentry or logging, or when the user mentions ib-toolkit or @ib-toolkit.
---

# ib-toolkit

Read the "inBeat toolkit standard" block in `AGENTS.md` first. This skill is the how-to. Examples use `authorizeStaff` as a stand-in for the app's own `authorize` check; public endpoints use `publicAccess` plus a rate limiter.

## Server action

```ts
"use server";
import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { authorizeStaff } from "@/shared/lib/auth";
import { createClientSchema } from "../schemas";
import { createClientRecord } from "../server/create-client-record";

export const createClient = action({
  name: "clients.create",
  schema: createClientSchema,
  authorize: authorizeStaff,
  run: async (input, viewer) => ok(await createClientRecord(input, viewer.userId)),
  revalidate: () => ["/clients"],
});
```

Client side: `const result = await createClient(values); if (!result.ok) toast.error(result.error);`

Public action: `authorize: publicAccess`, then first thing in `run`:
`await rateLimiter.enforce(\`apply:${clientIp(await headers())}\`, { limit: 5, window: "10 m" })`.
The limiter is one shared instance in `src/shared/lib/rate-limit.ts` (`createRateLimiter({ prefix, upstash })`
with the `upstashEnv` values) imported by every action and route. Get the IP only from `clientIp` in
`@inbeat/next/rate-limit` (routes pass `request.headers`); never write your own header parsing.
`clientIp` is reliable on Vercel only; self-hosted apps behind a proxy pass `{ trustedProxyHops: n }`,
otherwise it returns `"unknown"`. Public forms using Turnstile without Clerk must add its hosts via
`securityHeaders({ sources: { script: ["https://challenges.cloudflare.com"], frame: ["https://challenges.cloudflare.com"] } })`.

## Route handler

```ts
import { route } from "@inbeat/next/route";
export const GET = route({
  name: "clients.list",
  authorize: authorizeStaff,
  query: z.object({ cursor: z.string().optional() }),
  handler: async ({ query }) => listClients(query.cursor),
});
```

## Errors

- Deny: `throw new AppError("forbidden", "reason for logs")`. The user sees safe default copy.
- Expected business failure: `return fail("That handle is taken", "conflict")`.
- Anything else: let it throw. The wrapper classifies, reports to Sentry and returns `ERR_xxxx`.
- Postgres: `isUniqueViolation(err)` from `@inbeat/core/errors`, never string matching.

## Authorization

`authorize` is the app's own check: it returns the viewer or throws `AppError("auth" | "forbidden")`. Roles, admin rules and ownership are app decisions; write them in the app (for example `src/shared/lib/auth.ts`) and pass them to `action()` and `route()`.

## Integrations

Sentry is already wired in the template.

Run `ib mcp` to give your AI tool access to Vercel, Sentry, Neon, Clerk, Cloudflare. For GitHub use the `gh` CLI.

### Auth (Clerk)

1. Run `npx -y clerk@latest init` (works with `bunx`). It detects Next.js and applies Clerk's setup; `npx -y clerk@latest doctor` verifies it.
2. In `proxy.ts`, exclude `/monitoring` (the Sentry tunnel) from the matcher, and keep `/api/health` and `/robots.txt` public.
3. Pass `clerkFrontendApi(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)` to `securityHeaders` (the base `next.config.ts` already does).
4. Add `clerkServerEnv` and `clerkClientEnv` from `@inbeat/core/env` to `src/shared/config/env.ts` (see Env below).

Access pattern. Clerk's development and production instances are configured separately: apply every
dashboard step to both.

- Who gets in: a staff-only app turns on the Clerk allowlist (`*@inbeat.agency`, …). It only blocks
  new sign-ups, so review existing users once after enabling it. Apps with external users keep
  sign-ups open and rely on roles.
- Roles: `publicMetadata.role`, assigned in the Clerk dashboard (users cannot edit it). Expose it
  with the session token claim `{"metadata": "{{user.public_metadata}}"}`, read it from
  `sessionClaims.metadata.role`. No role or an unknown one gets the least access the app has:
  none, or its default role (e.g. member, creator). Never fall back to a privileged role.
- Checks run on the server, twice: the proxy requires sign-in outside the public routes and blocks
  role-gated areas; every role-gated page, action and route checks again (`authorize`). Hiding UI
  is not access control.
- Stays in the app: users table (if joins need it), ownership ("owner or admin"), rate limits,
  maintenance mode.
- Deviation: deriving a role from a verified email domain is allowed when the app documents it in
  AGENTS.md "Deliberate deviations".

### Database (Neon + Drizzle)

1. Run `npx neon@latest init` to link the Neon project and install the agent tooling.
2. Set up Drizzle per its Neon guide: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, and a `drizzle.config.ts` with `dialect: "postgresql"`.
3. Conventions from the standard's Data section: tables in `src/db/schema/<table>.ts`, UUID primary keys, migrations generated with `drizzle-kit generate` and reviewed, and never run migrations or destructive SQL against production.

## Env

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { clerkClientEnv, clerkServerEnv, dbEnv, upstashEnv } from "@inbeat/core/env";
export const env = createEnv({
  server: { ...dbEnv, ...clerkServerEnv, ...upstashEnv },
  client: { ...clerkClientEnv },
  experimental__runtimeEnv: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY },
  emptyStringAsUndefined: true,
});
```

## Other building blocks

| Need | Import |
|---|---|
| Neon pool | `createDb` from `@inbeat/next/db` |
| Clerk webhook | `createClerkWebhookHandler` from `@inbeat/next/clerk-webhook` |
| Headers/CSP | `securityHeaders`, `clerkFrontendApi` from `@inbeat/next/security-headers` |
| Sentry | `sentryServerOptions` from `@inbeat/next/sentry` (server, edge); `sentryClientOptions` from `@inbeat/next/sentry-client` (browser only) |
| Redirect param | `safeRedirectPath` from `@inbeat/next/safe-redirect` |

## Changing the toolkit

Edit `~/Desktop/@inbeat/ib-toolkit`, run its tests, then `bun run sync <app-dir>` there to copy
the sources into the app's `node_modules/@inbeat/*` (use `--watch` while iterating).
