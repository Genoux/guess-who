---
name: ib-feature
description: Scaffold or extend a feature slice in an inBeat app following the toolkit layout (actions, queries, server, components, schemas, tests). Use when adding a new feature, entity, page with data, or when the user mentions ib-feature or @ib-feature.
---

# ib-feature

## Steps

1. **Schema.** Table in `src/db/schema/<table>.ts` (uuid pk, `timestamp({ withTimezone: true })`,
   snake_case). Export from `src/db/schema/index.ts`. `bun run db:generate`, then read the SQL.
   Never apply to production unless the user says "apply migrations to prod".
2. **Entities.** Shared types, zod schemas, constants in `src/entities/<name>.ts` if more than
   one feature needs them; otherwise `src/features/<f>/schemas.ts` and `types.ts`.
3. **Server.** `src/features/<f>/server/<verb>-<noun>-record.ts` with `import "server-only"`.
   Pure DB/domain logic, takes validated input plus the viewer id, returns data or throws
   `AppError`. Policies: `assert-can-<verb>.ts`.
4. **Queries.** `src/features/<f>/queries/get-<noun>.ts` / `list-<nouns>.ts`, `import "server-only"`,
   run the app's own authorize check first when the app has auth, called from Server Components.
5. **Actions.** `src/features/<f>/actions/<verb>-<noun>.ts` with `"use server"` and `action()`.
   One export per file. `revalidate` the pages that show the data.
6. **Routes** only for client polling, infinite lists, webhooks, presign: `route()` in
   `src/app/api/<f>/.../route.ts`.
7. **UI.** Page in `src/app/.../page.tsx` (Server Component) renders feature components from
   `src/features/<f>/components`. Client leaves call actions and handle `Result`.
8. **Tests.** Colocated `*.test.ts` for every `server/` command and policy and every `lib/` helper, including `src/shared/lib`.
9. **Check.** `bun run lint && bunx tsc --noEmit && bun run test && bun run lint:arch`.

## Naming

- Files kebab-case, one operation per file, named exports, no barrels (except `db/schema`).
- Actions verb+noun (`createClient`), queries `get*`/`list*`, server `*Record`,
  policies `assertCan*`, hooks `use-*`.
- Indexes `<table>_<cols>_idx`, uniques `<table>_<cols>_unique`, FKs `*_user_id`.

## Don't

- Import another feature. Move the shared piece to `entities/` or `shared/`.
- Read data through a server action.
- Put `"use server"` on a file under `server/`.
