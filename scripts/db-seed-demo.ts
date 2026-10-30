// Dev-only demo game, so the album can be played locally. Never runs against production.
//
//   bun run db:seed:demo -- --player <email> [--day 6] [--welcomer <seeded email>]
//   bun run db:seed:demo -- --as-welcomer <email> [--day 2]
//   bun run db:seed:demo -- --admin-board
//
// --player: (re)creates a mission where <email> is the player, on game day --day, with a seeded
//   welcomer whose clues 2 to 4 are written. The email signs in as the player.
// --as-welcomer: (re)creates a mission where <email> is the secret welcomer of the seeded player
//   Léa Dubois, with their three clues written.
// --admin-board: (re)creates the people and missions on @example.com and @gmail.example emails
//   that fill the admin People page: playing, not signed in, done, and on the
//   Team view people who never played, with clues missing or a card not done. The seeded teammates sign in with a fake Clerk id so they show as off.
//   Only missions for those emails are replaced.
// --demo: idempotent, resets every demo state. About 25 complete fake teammates (card, three clues,
//   an Unsplash headshot committed as public/demo/avatars/<slug>.webp; the sources are listed in
//   demo-cast.ts) and six sign-in personas on Clerk test emails,
//   one per state: newhire, player, welcomer, teammate, done, admin, as
//   <key>+clerk_test@inbeat.agency. Sign in on the DEV instance with the email and the code 424242.
//   ONE MANUAL STEP, once, on the Clerk dashboard of the DEV instance only: User & authentication,
//   Email, enable "Email verification code" as a sign-in strategy (the app signs in with Slack).
//   The six persona users are created, or patched if they exist, through the Clerk Backend API when
//   CLERK_SECRET_KEY is a test key (sk_test_): verified email, no password, the persona's name, and
//   {"role": "admin"} in the public metadata of the admin persona only. Without a test key, create
//   them in the dashboard by hand.
// WARNING: Vercel previews share the dev database and the dev Clerk instance. Never run --demo or
//   --admin-board while teammates are testing: --demo creates the admin persona, who signs in
//   with the code 424242, on that shared Clerk instance, and both modes reset people and missions.
// All modes upsert 20 seeded teammates with filled cards across the five teams.
// --player also collects five stickers (two on the maybe list, one wrong guess) so the album looks
//   mid-game; pass --fresh for an empty album.
// While signed in on a dev server, the scenario menu on /play reseeds your own game in one click.
import { parseArgs } from "node:util";
import { normalizeEmail } from "@inbeat/core/email";
import { Pool } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/neon-serverless";
import { assertNotProduction } from "../src/db/assert-not-production";
import * as schema from "../src/db/schema";
import { DEMO_PERSONAS } from "../src/features/games/server/demo-cast";
import {
  clerkApi,
  ensureClerkUsers,
  isClerkTestKey,
} from "../src/features/games/server/demo-clerk";
import {
  DEMO_PLAYER,
  DEMO_TEAM_COUNT,
  DEMO_TEAMMATE_COUNT,
  DEMO_WELCOMER_EMAIL,
  seedAdminBoard,
  seedDemoGame,
} from "../src/features/games/server/seed-demo-game";
import { seedDemoPersonas } from "../src/features/games/server/seed-demo-personas";

loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
assertNotProduction(url);

const { values } = parseArgs({
  options: {
    player: { type: "string" },
    "as-welcomer": { type: "string" },
    welcomer: { type: "string", default: DEMO_WELCOMER_EMAIL },
    day: { type: "string" },
    fresh: { type: "boolean", default: false },
    "admin-board": { type: "boolean", default: false },
    demo: { type: "boolean", default: false },
  },
});

const pool = new Pool({ connectionString: url });

if (values.demo) {
  try {
    const { cast, personas } = await seedDemoPersonas(drizzle(pool, { schema }), new Date());
    console.info(`Demo ready: ${cast} teammates, ${personas.length} personas.`);
    console.table(await withClerkUsers(personas));
    console.info("Sign in with the email and the code 424242 (dev instance, email code enabled).");
  } finally {
    await pool.end();
  }
  process.exit(0);
}

if (values["admin-board"]) {
  try {
    const { missions } = await seedAdminBoard(drizzle(pool, { schema }), new Date());
    console.info(
      `Admin board ready: ${missions} people on top of the teammates. Open /admin as an admin.`,
    );
  } finally {
    await pool.end();
  }
  process.exit(0);
}

const asWelcomer = values["as-welcomer"] ? normalizeEmail(values["as-welcomer"]) : undefined;
const player = values.player ? normalizeEmail(values.player) : undefined;
if (Boolean(asWelcomer) === Boolean(player)) {
  console.error("Pass exactly one of --player <email> or --as-welcomer <email>.");
  process.exit(1);
}
const day = Number(values.day ?? (asWelcomer ? 2 : 6));
if (!Number.isInteger(day) || day < 1 || day > 20) {
  console.error("--day must be a whole number from 1 to 20 (15+ ends the game as revealed).");
  process.exit(1);
}
const welcomer = normalizeEmail(values.welcomer);

try {
  const { removed, startDate } = await seedDemoGame(drizzle(pool, { schema }), {
    player,
    asWelcomer,
    welcomer,
    day,
    fresh: values.fresh,
  });
  console.info(
    [
      `Demo game ready (replaced ${removed}): day ${day}, started ${startDate}.`,
      player
        ? `Sign in as ${player} and open /play. The welcomer is ${welcomer}.`
        : `Sign in as ${asWelcomer} and open /welcomer. The player is ${DEMO_PLAYER.name}.`,
      `Seeded ${DEMO_TEAMMATE_COUNT} teammates across ${DEMO_TEAM_COUNT} teams.`,
    ].join("\n"),
  );
} finally {
  await pool.end();
}

/** Adds each persona's Clerk user id to the table, creating or patching the users on a dev instance. */
async function withClerkUsers<Row extends { email: string }>(personas: readonly Row[]) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!isClerkTestKey(secret)) {
    console.info(
      "No Clerk test key, so no users were created. Create each email in the Clerk dashboard, and set" +
        ' {"role": "admin"} in the public metadata of the admin one.',
    );
    return personas;
  }
  try {
    const users = await ensureClerkUsers(DEMO_PERSONAS, clerkApi(secret));
    return personas.map((row) => {
      const user = users.find(({ email }) => email === row.email);
      return { ...row, clerk: user ? `${user.id} (${user.action})` : "" };
    });
  } catch (err) {
    console.info(`Clerk call failed: ${(err as Error).message}. Create the users by hand.`);
    return personas;
  }
}
