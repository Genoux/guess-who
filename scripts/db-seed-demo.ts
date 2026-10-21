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
import { parseArgs } from "node:util";
import { normalizeEmail } from "@inbeat/core/email";
import { Pool } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { assertNotProduction } from "../src/db/assert-not-production";
import * as schema from "../src/db/schema";
import {
  addDays,
  CLUE_NUMBERS,
  clueReleaseAt,
  GAME_TIME_ZONE,
} from "../src/features/games/lib/game-schedule";

loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
assertNotProduction(url);

const { values } = parseArgs({
  options: {
    player: { type: "string" },
    "as-welcomer": { type: "string" },
    welcomer: { type: "string", default: "ana.ferreira@example.com" },
    day: { type: "string" },
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

const teams = [
  { name: "Creative", color: "#46BDF0", tint: "#B5E5F9", sortOrder: 1 },
  { name: "Strategy", color: "#157428", tint: "#A1C8A9", sortOrder: 2 },
  { name: "Talent", color: "#FF97AB", tint: "#FFD5DD", sortOrder: 3 },
  { name: "Paid", color: "#FFC592", tint: "#FFE8D3", sortOrder: 4 },
  { name: "Ops", color: "#95B9AD", tint: "#D5E3DE", sortOrder: 5 },
];

// name, team, city, fact, ask
const teammates = [
  [
    "Ana Ferreira",
    "Creative",
    "Lisbon",
    "Bikes to every meeting, rain or not.",
    "Learning the cello at 30",
  ],
  ["Mateo Ruiz", "Creative", "Madrid", "Owns more records than plates.", "Why vinyl sounds better"],
  [
    "Noor Haddad",
    "Creative",
    "Toronto",
    "Once won a pie-eating contest by accident.",
    "The best bakery in any city",
  ],
  [
    "Maya Chen",
    "Creative",
    "Montréal",
    "Ran a marathon in a dinosaur costume.",
    "My sourdough starter",
  ],
  ["Leo Martin", "Creative", "Toronto", "Speaks four languages, all badly.", "Film cameras"],
  [
    "Jonah Park",
    "Strategy",
    "Seoul",
    "Keeps a spreadsheet of every meal since 2019.",
    "Fantasy football spreadsheets",
  ],
  ["Inès Moreau", "Strategy", "Paris", "Grew up above a cheese shop.", "Natural wine, politely"],
  ["Sofia Rossi", "Strategy", "Lisbon", "Once met a president by accident.", "Board games"],
  ["Noah Dubois", "Strategy", "Montréal", "Grew up on a sailboat.", "Knots"],
  ["Ava Patel", "Talent", "London", "Has a pet tortoise named Speedy.", "Reptiles"],
  ["Ethan Kim", "Talent", "New York", "Played drums in a ska band.", "Vinyl"],
  [
    "Hana Kim",
    "Talent",
    "Vancouver",
    "Throws pots that come out wrong on purpose.",
    "Ceramics that came out wrong",
  ],
  ["Zoe Garcia", "Paid", "Mexico City", "Solves a Rubik's cube in under a minute.", "Puzzles"],
  ["Lucas Silva", "Paid", "São Paulo", "Worked as a ski instructor.", "Mountains"],
  ["Omar Aziz", "Paid", "Cairo", "Does the crossword in pen, every day.", "Crosswords in pen"],
  [
    "Elena Rossi",
    "Paid",
    "Rome",
    "Has her grandmother's pasta rules framed.",
    "Her grandmother's pasta rules",
  ],
  ["Chloe Nguyen", "Ops", "Montréal", "Bakes a cake for every birthday.", "Frosting"],
  ["Sam Taylor", "Ops", "Remote", "Visited 40 countries.", "Night trains"],
  [
    "Julia Novak",
    "Ops",
    "Prague",
    "Owns a board game with a 90-page rulebook.",
    "Board games with too many rules",
  ],
  ["Ben Carter", "Ops", "Austin", "Smokes brisket for 14 hours at a time.", "Smoking brisket"],
] as const;

const emailOf = (name: string) =>
  `${name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".")}@example.com`;

const DEMO_PLAYER = { name: "Léa Dubois", email: "lea.dubois@example.com" };
const CLUES = {
  2: "Has never owned a car, and never plans to.",
  3: "Learning an instrument most people quit as kids.",
  4: "Plays it badly in every team call.",
} as const;

function todayInGameZone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GAME_TIME_ZONE }).format(new Date());
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

try {
  await db.insert(schema.teams).values(teams).onConflictDoNothing();
  const teamIds = new Map(
    (await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams)).map(
      (team) => [team.name, team.id],
    ),
  );

  // Seeded teammates get filled, visible cards; reruns refresh them.
  await db
    .insert(schema.people)
    .values(
      teammates.map(([name, team, location, fact, ask]) => ({
        name,
        email: emailOf(name),
        teamId: teamIds.get(team),
        location,
        fact,
        ask,
        hidden: false,
      })),
    )
    .onConflictDoUpdate({
      target: schema.people.email,
      set: {
        name: sql`excluded.name`,
        teamId: sql`excluded.team_id`,
        location: sql`excluded.location`,
        fact: sql`excluded.fact`,
        ask: sql`excluded.ask`,
        hidden: false,
      },
    });

  const startDate = addDays(todayInGameZone(), -(day - 1));
  let gamePlayerEmail: string;
  let welcomerId: string;
  let writeClues: boolean;

  if (player) {
    const welcomerEmail = normalizeEmail(values.welcomer ?? "");
    if (!teammates.some(([name]) => emailOf(name) === welcomerEmail)) {
      throw new Error(`--welcomer must be a seeded teammate, e.g. ${emailOf(teammates[0][0])}`);
    }
    if (welcomerEmail === player) throw new Error("The player cannot welcome themselves.");
    const [welcomer] = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(eq(schema.people.email, welcomerEmail));
    if (!welcomer) throw new Error(`Seeded welcomer ${welcomerEmail} is missing`);
    gamePlayerEmail = player;
    welcomerId = welcomer.id;
    writeClues = true;
  } else {
    const email = asWelcomer as string;
    // The welcomer needs a filled card so the player can collect and guess them.
    await db
      .insert(schema.people)
      .values({
        email,
        name: email.split("@")[0]?.replace(/[._-]+/g, " ") ?? email,
        teamId: teamIds.get("Talent"),
        ask: "Ask me anything",
      })
      .onConflictDoUpdate({
        target: schema.people.email,
        set: {
          teamId: sql`coalesce(${schema.people.teamId}, excluded.team_id)`,
          ask: sql`coalesce(nullif(${schema.people.ask}, ''), excluded.ask)`,
          hidden: false,
        },
      });
    await db
      .insert(schema.people)
      .values({ email: DEMO_PLAYER.email, name: DEMO_PLAYER.name })
      .onConflictDoNothing({ target: schema.people.email });
    const [welcomer] = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(eq(schema.people.email, email));
    if (!welcomer) throw new Error("Welcomer row is missing");
    gamePlayerEmail = DEMO_PLAYER.email;
    welcomerId = welcomer.id;
    writeClues = false;
  }

  // Reset: one demo game per player email (clues, collections, guesses go with it).
  const removed = await db
    .delete(schema.games)
    .where(eq(schema.games.playerEmail, gamePlayerEmail))
    .returning({ id: schema.games.id });
  if (asWelcomer) {
    // Also drop older demo games this welcomer had, so /welcomer shows the new one.
    const [welcomerRow] = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(eq(schema.people.email, asWelcomer));
    const old = await db
      .select({ id: schema.games.id, email: schema.games.playerEmail })
      .from(schema.games)
      .where(eq(schema.games.welcomerPersonId, welcomerRow?.id ?? ""));
    const demoGames = old.filter((game) => game.email.endsWith("@example.com")).map((g) => g.id);
    if (demoGames.length > 0) {
      await db.delete(schema.games).where(inArray(schema.games.id, demoGames));
    }
  }

  const [playerRow] = await db
    .select({ id: schema.people.id })
    .from(schema.people)
    .where(eq(schema.people.email, gamePlayerEmail));
  const [game] = await db
    .insert(schema.games)
    .values({
      playerEmail: gamePlayerEmail,
      playerPersonId: playerRow?.id ?? null,
      welcomerPersonId: welcomerId,
      startDate,
    })
    .returning({ id: schema.games.id });
  if (!game) throw new Error("Game insert failed");

  await db.insert(schema.clues).values(
    CLUE_NUMBERS.map((number) => ({
      gameId: game.id,
      number,
      text: number === 1 || !writeClues ? null : CLUES[number],
      releaseAt: clueReleaseAt(startDate, number),
    })),
  );

  console.info(
    [
      `Demo game ready (replaced ${removed.length}): day ${day}, started ${startDate}.`,
      player
        ? `Sign in as ${player} and open /play. The welcomer is ${values.welcomer}.`
        : `Sign in as ${asWelcomer} and open /welcomer. The new hire is ${DEMO_PLAYER.name}.`,
      `Seeded ${teammates.length} teammates across ${teams.length} teams.`,
    ].join("\n"),
  );
} finally {
  await pool.end();
}
