// Dev-only demo game, so the album can be played locally. Never runs against production.
//
//   bun run db:seed:demo -- --player <email> [--day 6] [--welcomer <seeded email>]
//   bun run db:seed:demo -- --as-welcomer <email> [--day 2]
//
// --player: (re)creates a game where <email> is the new hire, on game day --day, with a seeded
//   welcomer whose clues 2 to 4 are written. The email signs in as the player.
// --as-welcomer: (re)creates a game where <email> is the secret welcomer of the seeded new hire
//   Léa Dubois, with no clues written yet.
// Both upsert 20 seeded teammates with filled cards across the five teams.
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
import {
  DEMO_PLAYER,
  DEMO_TEAM_COUNT,
  DEMO_TEAMMATE_COUNT,
  DEMO_WELCOMER_EMAIL,
  seedDemoGame,
} from "../src/features/games/server/seed-demo-game";

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
  },
});

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

const pool = new Pool({ connectionString: url });
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
        : `Sign in as ${asWelcomer} and open /welcomer. The new hire is ${DEMO_PLAYER.name}.`,
      `Seeded ${DEMO_TEAMMATE_COUNT} teammates across ${DEMO_TEAM_COUNT} teams.`,
    ].join("\n"),
  );
} finally {
  await pool.end();
}
