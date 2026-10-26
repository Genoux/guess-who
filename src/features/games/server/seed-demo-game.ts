import "server-only";
import { and, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { addDays, CLUE_NUMBERS, clueReleaseAt, GAME_TIME_ZONE } from "../lib/game-schedule";

type SchemaDb = NeonDatabase<typeof schema>;

export type SeedDemoGameOptions = {
  /** The new hire's email; the game seeds a seeded welcomer with clues 2 to 4 written. */
  player?: string;
  /** The secret welcomer's email; the game seeds Léa Dubois as the new hire, with no clues. */
  asWelcomer?: string;
  /** The seeded teammate who welcomes a --player game. */
  welcomer: string;
  /** Today's game day; day 1 is the start date. */
  day: number;
  /** An empty album instead of five collected stickers, two maybes and one wrong guess. */
  fresh: boolean;
  /** The highest clue the player has turned over. */
  lastReadClue?: number;
  outcome?: "active" | "found" | "revealed";
  /** Skip the welcome intro. */
  introSeen?: boolean;
  /** Clues 2 to 4 written, in order; all three for a --player game, none for --as-welcomer. */
  cluesWritten?: number;
};

const TEAMS = [
  { name: "Creative", color: "#46BDF0", tint: "#B5E5F9", sortOrder: 1 },
  { name: "Strategy", color: "#157428", tint: "#A1C8A9", sortOrder: 2 },
  { name: "Talent", color: "#FF97AB", tint: "#FFD5DD", sortOrder: 3 },
  { name: "Paid", color: "#FFC592", tint: "#FFE8D3", sortOrder: 4 },
  { name: "Ops", color: "#95B9AD", tint: "#D5E3DE", sortOrder: 5 },
];

// name, team, city, fact, ask
const TEAMMATES = [
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

export const DEMO_TEAMMATE_COUNT = TEAMMATES.length;
export const DEMO_TEAM_COUNT = TEAMS.length;

export const demoEmailOf = (name: string) =>
  `${name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".")}@example.com`;

export const DEMO_PLAYER = { name: "Léa Dubois", email: "lea.dubois@example.com" };
export const DEMO_WELCOMER_EMAIL = demoEmailOf("Ana Ferreira");

// Stand-in profile pictures for demo people only; real people get their Clerk (Slack) picture.
const PORTRAITS: Record<string, number> = {
  "Ana Ferreira": 30,
  "Noor Haddad": 16,
  "Maya Chen": 39,
  "Inès Moreau": 44,
  "Sofia Rossi": 31,
  "Ava Patel": 34,
  "Hana Kim": 25,
  "Zoe Garcia": 49,
  "Elena Rossi": 38,
  "Chloe Nguyen": 5,
  "Julia Novak": 45,
  "Léa Dubois": 24,
  "Mateo Ruiz": 14,
  "Leo Martin": 8,
  "Jonah Park": 59,
  "Noah Dubois": 53,
  "Ethan Kim": 52,
  "Lucas Silva": 60,
  "Omar Aziz": 18,
  "Ben Carter": 11,
  "Sam Taylor": 15,
};
const TESTER_PORTRAIT = 13;
const portraitOf = (name: string) =>
  `https://i.pravatar.cc/600?img=${PORTRAITS[name] ?? TESTER_PORTRAIT}`;
const STAND_IN_HOSTS = ["https://i.pravatar.cc/%", "https://randomuser.me/%"];
const CLUES = {
  2: "Has never owned a car, and never plans to.",
  3: "Learning an instrument most people quit as kids.",
  4: "Plays it badly in every team call.",
} as const;

// Mid-game progress for a --player game: what the player learned, who they suspect, one miss.
const PROGRESS = [
  { name: "Maya Chen", note: "Runs a supper club every second Friday." },
  { name: "Noor Haddad", note: "Keeps a ranked list of croissants from 14 cities." },
  {
    name: "Ana Ferreira",
    note: "Started cello lessons in January, practises at 6 am.",
    maybe: true,
  },
  { name: "Mateo Ruiz", note: "Has never owned a car. Bikes everywhere.", maybe: true },
  { name: "Jonah Park", note: "Tracks every meal he has eaten since 2019.", wrongGuess: true },
];

function todayInGameZone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GAME_TIME_ZONE }).format(new Date());
}

async function seedProgress(db: SchemaDb, gameId: string, welcomerEmail: string) {
  const rows = await db
    .select({ id: schema.people.id, email: schema.people.email })
    .from(schema.people)
    .where(
      inArray(
        schema.people.email,
        PROGRESS.map(({ name }) => demoEmailOf(name)),
      ),
    );
  const idOf = new Map(rows.map((row) => [row.email, row.id]));
  for (const entry of PROGRESS) {
    const email = demoEmailOf(entry.name);
    const personId = idOf.get(email);
    if (!personId) continue;
    await db.insert(schema.collections).values({ gameId, personId, note: entry.note });
    if (entry.maybe) await db.insert(schema.shortlists).values({ gameId, personId });
    // Never rule out the real welcomer: that guess would have ended the game.
    if (entry.wrongGuess && email !== welcomerEmail) {
      await db.insert(schema.guesses).values({ gameId, personId, correct: false });
    }
  }
}

/** The player collected their welcomer and guessed right. */
async function seedFound(db: SchemaDb, gameId: string, welcomerId: string) {
  await db
    .insert(schema.collections)
    .values({ gameId, personId: welcomerId, note: "Turned out to be my welcomer." })
    .onConflictDoNothing();
  await db.insert(schema.guesses).values({ gameId, personId: welcomerId, correct: true });
}

/**
 * Dev-only: (re)creates one demo game and the seeded teammates it is played with. Callers must
 * have checked the database is not production.
 */
export async function seedDemoGame(
  db: SchemaDb,
  {
    player,
    asWelcomer,
    welcomer: welcomerOption,
    day,
    fresh,
    lastReadClue = 0,
    outcome = "active",
    introSeen = false,
    cluesWritten = player ? 3 : 0,
  }: SeedDemoGameOptions,
): Promise<{ removed: number; startDate: string }> {
  await db.insert(schema.teams).values(TEAMS).onConflictDoNothing();
  const teamIds = new Map(
    (await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams)).map(
      (team) => [team.name, team.id],
    ),
  );

  // Seeded teammates get filled, visible cards; reruns refresh them.
  await db
    .insert(schema.people)
    .values(
      TEAMMATES.map(([name, team, location, fact, ask]) => ({
        name,
        email: demoEmailOf(name),
        imageUrl: portraitOf(name),
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
        imageUrl: sql`excluded.image_url`,
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

  if (player) {
    const welcomerEmail = welcomerOption;
    if (!TEAMMATES.some(([name]) => demoEmailOf(name) === welcomerEmail)) {
      throw new Error(`--welcomer must be a seeded teammate, e.g. ${DEMO_WELCOMER_EMAIL}`);
    }
    if (welcomerEmail === player) throw new Error("The player cannot welcome themselves.");
    const [welcomer] = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(eq(schema.people.email, welcomerEmail));
    if (!welcomer) throw new Error(`Seeded welcomer ${welcomerEmail} is missing`);
    gamePlayerEmail = player;
    welcomerId = welcomer.id;
  } else if (asWelcomer) {
    const email = asWelcomer;
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
      .values({
        email: DEMO_PLAYER.email,
        name: DEMO_PLAYER.name,
        imageUrl: portraitOf(DEMO_PLAYER.name),
      })
      .onConflictDoUpdate({
        target: schema.people.email,
        set: { imageUrl: sql`excluded.image_url` },
      });
    const [welcomer] = await db
      .select({ id: schema.people.id })
      .from(schema.people)
      .where(eq(schema.people.email, email));
    if (!welcomer) throw new Error("Welcomer row is missing");
    gamePlayerEmail = DEMO_PLAYER.email;
    welcomerId = welcomer.id;
  } else {
    throw new Error("Pass exactly one of player or asWelcomer.");
  }

  // Reset: one demo game per player email (clues, collections, guesses go with it).
  const removed = await db
    .delete(schema.games)
    .where(eq(schema.games.playerEmail, gamePlayerEmail))
    .returning({ id: schema.games.id });
  if (asWelcomer) {
    // Also drop older demo games this welcomer had, so /welcomer shows the new one.
    const old = await db
      .select({ id: schema.games.id, email: schema.games.playerEmail })
      .from(schema.games)
      .where(eq(schema.games.welcomerPersonId, welcomerId));
    const demoGames = old.filter((game) => game.email.endsWith("@example.com")).map((g) => g.id);
    if (demoGames.length > 0) {
      await db.delete(schema.games).where(inArray(schema.games.id, demoGames));
    }
  }

  // A signed-in tester without a real picture gets a stand-in so their own sticker looks real.
  for (const email of [player, asWelcomer].filter((value): value is string => Boolean(value))) {
    await db
      .update(schema.people)
      .set({ imageUrl: portraitOf("") })
      .where(
        and(
          eq(schema.people.email, email),
          or(
            isNull(schema.people.imageUrl),
            ...STAND_IN_HOSTS.map((host) => like(schema.people.imageUrl, host)),
          ),
        ),
      );
  }

  const [playerRow] = await db
    .select({ id: schema.people.id })
    .from(schema.people)
    .where(eq(schema.people.email, gamePlayerEmail));
  const now = new Date();
  const [game] = await db
    .insert(schema.games)
    .values({
      playerEmail: gamePlayerEmail,
      playerPersonId: playerRow?.id ?? null,
      welcomerPersonId: welcomerId,
      startDate,
      status: outcome,
      foundAt: outcome === "found" ? now : null,
      introSeenAt: introSeen ? now : null,
      lastReadClue,
    })
    .returning({ id: schema.games.id });
  if (!game) throw new Error("Game insert failed");

  await db.insert(schema.clues).values(
    CLUE_NUMBERS.map((number) => ({
      gameId: game.id,
      number,
      text: number === 1 || number - 1 > cluesWritten ? null : CLUES[number],
      releaseAt: clueReleaseAt(startDate, number),
    })),
  );

  if (player && !fresh) await seedProgress(db, game.id, welcomerOption);
  if (outcome === "found") await seedFound(db, game.id, welcomerId);

  return { removed: removed.length, startDate };
}

/** Dev-only: drops every game the person plays or welcomes, so they are a plain teammate. */
export async function clearPersonGames(db: SchemaDb, email: string): Promise<void> {
  const [person] = await db
    .select({ id: schema.people.id })
    .from(schema.people)
    .where(eq(schema.people.email, email));
  await db
    .delete(schema.games)
    .where(
      person
        ? or(eq(schema.games.playerEmail, email), eq(schema.games.welcomerPersonId, person.id))
        : eq(schema.games.playerEmail, email),
    );
}

const FILLED_CARD = {
  team: "Strategy",
  location: "Montréal",
  fact: "Has a drawer of mismatched socks, on purpose.",
  ask: "The best poutine in town",
};

/** Dev-only: fills the person's sticker card, or empties it as on their first visit. */
export async function setPersonCard(db: SchemaDb, email: string, filled: boolean): Promise<void> {
  const [team] = await db
    .select({ id: schema.teams.id })
    .from(schema.teams)
    .where(eq(schema.teams.name, FILLED_CARD.team));
  await db
    .update(schema.people)
    .set(
      filled
        ? {
            teamId: team?.id ?? null,
            location: FILLED_CARD.location,
            fact: FILLED_CARD.fact,
            ask: FILLED_CARD.ask,
          }
        : { teamId: null, location: null, fact: null, ask: null },
    )
    .where(eq(schema.people.email, email));
}
