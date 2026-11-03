// Dev-only sample data. Idempotent: rerunning skips rows that already exist.
import { Pool } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/neon-serverless";
import { assertNotProduction } from "../src/db/assert-not-production";
import * as schema from "../src/db/schema";
import { seedTeams } from "../src/db/seed-teams";

loadEnvConfig(process.cwd(), true);

const url = process.env.DATABASE_URL;
assertNotProduction(url);

const people = [
  [
    "Maya Chen",
    "Creative",
    "Montréal",
    "Ran a marathon in a dinosaur costume",
    "Ask me about my sourdough",
  ],
  ["Leo Martin", "Creative", "Toronto", "Speaks four languages badly", "Ask me about film cameras"],
  [
    "Sofia Rossi",
    "Strategy",
    "Lisbon",
    "Once met a president by accident",
    "Ask me about board games",
  ],
  ["Noah Dubois", "Strategy", "Montréal", "Grew up on a sailboat", "Ask me about knots"],
  ["Ava Patel", "Talent", "London", "Has a pet tortoise named Speedy", "Ask me about reptiles"],
  ["Ethan Kim", "Talent", "New York", "Played drums in a ska band", "Ask me about vinyl"],
  [
    "Zoe Garcia",
    "Paid & Search",
    "Mexico City",
    "Can solve a Rubik's cube in a minute",
    "Ask me about puzzles",
  ],
  [
    "Lucas Silva",
    "Paid & Search",
    "São Paulo",
    "Worked as a ski instructor",
    "Ask me about mountains",
  ],
  ["Chloe Nguyen", "Ops", "Montréal", "Bakes a cake for every birthday", "Ask me about frosting"],
  ["Sam Taylor", "Ops", "Remote", "Visited 40 countries", "Ask me about night trains"],
] as const;

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

try {
  const teamIds = await seedTeams(db);

  await db
    .insert(schema.people)
    .values(
      people.map(([name, team, location, fact, ask]) => ({
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
        teamId: teamIds.get(team),
        location,
        fact,
        ask,
      })),
    )
    .onConflictDoNothing();

  console.info(`Seeded ${teamIds.size} teams and ${people.length} people`);
} finally {
  await pool.end();
}
