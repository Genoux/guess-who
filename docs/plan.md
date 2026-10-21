# The Album v1: build plan

Design source: https://claude.ai/artifact/9V2NQ7cHj3dC2rRtjs4ovj (Design system, Components, New hire,
Teammate + welcomer). Engineering rules: the inBeat toolkit standard in `AGENTS.md`.

## Accounts and roles

- Everyone signs in with Slack through Clerk. Allowlist the company email domains; anyone outside
  them (a contractor with a personal email) gets a Clerk invitation bound to their email.
- Clerk roles: `admin` (`publicMetadata.role`) and `member` (default). Nothing falls back to admin.
- New hire and welcomer are not roles. An admin starts a game with the new hire's email, start date
  and welcomer. When that email signs in, the person is the game's player and sees the game.
  Everyone else is a teammate and sees their sticker. Deel later creates the same game record.
- Every page, action and route checks access on the server. Hidden UI is not access control.

## What the server never sends

- A locked sticker's fact, location or photo to a player who has not collected it.
- A clue before its release time.
- The welcomer's identity before the game is found or revealed.
- A player's notes to anyone else, admins included.

## Data (one table per file, UUID keys, timestamps with time zone)

| Table | Holds |
|---|---|
| `teams` | name, colour, tint, order |
| `people` | clerk user id, email, name, team, location, fact, ask, photo key, sticker number, hidden |
| `games` | player person, welcomer person, player email, start date, status (active, found, revealed), found at |
| `clues` | game, number 1-4, text, release at |
| `collections` | game, person, note, how they chatted (player-only) |
| `shortlists` | game, person |
| `guesses` | game, person, correct, created at |
| `notifications` | type, payload, status, attempts, sent at (outbox for n8n) |

## Notifications (n8n, no Slack API in the app)

- Domain code writes an event to `notifications` in the same transaction as the change.
- A dispatcher posts each event as JSON to `N8N_WEBHOOK_URL`, signed with HMAC-SHA256 of
  `timestamp.body` (`X-Album-Timestamp`, `X-Album-Signature`), and retries on failure. The event id is
  the idempotency key.
- Events: `welcomer.assigned` (player day 2), `clue.released`, `clue.missing` (day before release),
  `game.found`, `game.revealed` (day 14), `card.reminder` (admin nudge). Payloads carry ids, emails
  and Slack user ids only, never notes.
- A daily Vercel cron (`CRON_SECRET`) releases clues, reveals day 14, queues reminders and flushes
  the outbox.

## Security checklist (each one has a unit test)

- `authorize` on every action and route; ownership checks for player and welcomer.
- Guess: game active, sticker collected, not ruled out, rate limited.
- Clues: only the game's welcomer, only before release.
- Uploads: presigned R2 URL, image types, size cap, key scoped to the user.
- Cron and webhooks verify their secret or signature. `securityHeaders()`, Sentry, no PII in logs.

## Phases

| # | Phase | Runs as |
|---|---|---|
| 0 | Foundation: template, repo, branch protection, CI, Vercel + release gate, Neon, Clerk, Sentry | lead, step by step |
| 1 | Data + auth + roles: schema, Clerk Slack sign-in, user sync, `authorize` helpers, proxy, policy tests | 1 agent |
| 2 | Game UI kit: Fieldtrip fonts and tokens, Sticker, ClueCard, GameButton, TopNav, Count, Stepper, effects; dev-only `/dev/components` | 1 agent, parallel with 1 |
| 3 | Teammate: sticker editor + photo upload | 1 agent |
| 4 | New hire: welcome, album, collect, mission, clue reveal, guess, found, own card | 2 agents |
| 5 | Welcomer: picked, clue stepper, status | 1 agent |
| 6 | Scheduler + notifications outbox to n8n | 1 agent |
| 7 | Admin (designed): games, game detail, people + invites, full album, settings (Deel API token + contract webhook, n8n webhook + secret, game timing, teams, sign-in domains) | 1-2 agents, after 1 |
| 8 | Hardening: Playwright on previews, CSP enforce, launch | lead + 1 agent |

Every phase lands as pull requests from `feat/*` branches: conventional PR titles, CI green,
code review, then the user approves the merge.

## Infrastructure the owner creates

- GitHub: private repo `Genoux/guess-who`.
- Vercel: project linked to the repo; env for preview and production.
- Neon: project with branching for previews; `DATABASE_URL`.
- Clerk: application with the Slack social connection, allowlist, the session claim
  `{"metadata": "{{user.public_metadata}}"}`; keys for dev and prod.
- Sentry: project `guess-who` in `inbeat-67`.
- Cloudflare R2: bucket for photos (phase 3).
- n8n: a webhook URL and a shared signing secret (phase 6).
