import "server-only";
import { and, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { seedTeams } from "@/db/seed-teams";
import { addDays, todayInGameZone, zonedTime } from "@/entities/game-schedule";
import { TEAM_DEFINITIONS } from "@/entities/teams";
import { CLUE_NUMBERS_TO_WRITE } from "../lib/welcomer-readiness";

type SchemaDb = NeonDatabase<typeof schema>;

export type SeedDemoGameOptions = {
  /** The player's email; the game is welcomed by a seeded teammate with all three clues written. */
  player?: string;
  /** The secret welcomer's email; the game seeds Léa Dubois as the player. */
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
  revealSeen?: boolean;
};

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
  [
    "Zoe Garcia",
    "Paid & Search",
    "Mexico City",
    "Solves a Rubik's cube in under a minute.",
    "Puzzles",
  ],
  ["Lucas Silva", "Paid & Search", "São Paulo", "Worked as a ski instructor.", "Mountains"],
  [
    "Omar Aziz",
    "Paid & Search",
    "Cairo",
    "Does the crossword in pen, every day.",
    "Crosswords in pen",
  ],
  [
    "Elena Rossi",
    "Paid & Search",
    "Rome",
    "Has her grandmother's pasta rules framed.",
    "Her grandmother's pasta rules",
  ],
  ["Chloe Nguyen", "Client Services", "Montréal", "Bakes a cake for every birthday.", "Frosting"],
  ["Sam Taylor", "Ops", "Remote", "Visited 40 countries.", "Night trains"],
  [
    "Julia Novak",
    "Sales",
    "Prague",
    "Owns a board game with a 90-page rulebook.",
    "Board games with too many rules",
  ],
  [
    "Ben Carter",
    "Freelancers",
    "Austin",
    "Smokes brisket for 14 hours at a time.",
    "Smoking brisket",
  ],
] as const;

export const DEMO_TEAMMATE_COUNT = TEAMMATES.length;
export const DEMO_TEAM_COUNT = TEAM_DEFINITIONS.length;

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

async function seedProgress(
  db: SchemaDb,
  { collectorId, gameId }: { collectorId: string; gameId: string },
  welcomerEmail: string,
) {
  await db.delete(schema.collections).where(eq(schema.collections.collectorPersonId, collectorId));
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
    await db
      .insert(schema.collections)
      .values({ collectorPersonId: collectorId, personId, note: entry.note });
    if (entry.maybe) await db.insert(schema.shortlists).values({ gameId, personId });
    // Never rule out the real welcomer: that guess would have ended the game.
    if (entry.wrongGuess && email !== welcomerEmail) {
      await db.insert(schema.guesses).values({ gameId, personId, correct: false });
    }
  }
}

/** The player collected their welcomer and guessed right. */
async function seedFound(
  db: SchemaDb,
  { collectorId, gameId }: { collectorId: string; gameId: string },
  welcomerId: string,
) {
  await db
    .insert(schema.collections)
    .values({
      collectorPersonId: collectorId,
      personId: welcomerId,
      note: "Turned out to be my welcomer.",
    })
    .onConflictDoNothing();
  await db.insert(schema.guesses).values({ gameId, personId: welcomerId, correct: true });
}

/** The welcomer's clues and team name as they stand now, copied into the game as Start does. */
export async function snapshotClues(db: SchemaDb, gameId: string, welcomerId: string) {
  const [welcomerTeam] = await db
    .select({ name: schema.teams.name })
    .from(schema.people)
    .leftJoin(schema.teams, eq(schema.people.teamId, schema.teams.id))
    .where(eq(schema.people.id, welcomerId));
  await db
    .update(schema.games)
    .set({ welcomerTeamName: welcomerTeam?.name ?? null })
    .where(eq(schema.games.id, gameId));
  const written = await db
    .select({ number: schema.welcomerClues.number, text: schema.welcomerClues.text })
    .from(schema.welcomerClues)
    .where(eq(schema.welcomerClues.personId, welcomerId));
  if (written.length === 0) return;
  await db.insert(schema.clues).values(written.map((clue) => ({ gameId, ...clue })));
}

/** Replaces the clues a teammate wrote for themselves with exactly these. */
async function setWelcomerClues(db: SchemaDb, personId: string, writtenNumbers: readonly number[]) {
  await db.delete(schema.welcomerClues).where(eq(schema.welcomerClues.personId, personId));
  if (writtenNumbers.length === 0) return;
  await db
    .insert(schema.welcomerClues)
    .values(
      writtenNumbers.map((number) => ({ personId, number, text: CLUES[number as 2 | 3 | 4] })),
    );
}

// Most teammates have all three clues; a few do not, and one has not finished their card, so
// the admin's missing list has someone on it.
const PARTIAL_CLUES: Record<string, readonly number[]> = {
  "Chloe Nguyen": [2],
  "Julia Novak": [2, 3],
  "Lucas Silva": [],
};
const UNFINISHED_CARD = "Elena Rossi";

async function seedTeammateClues(db: SchemaDb) {
  await db
    .update(schema.people)
    .set({ teamId: null, ask: null })
    .where(eq(schema.people.email, demoEmailOf(UNFINISHED_CARD)));
  const rows = await db
    .select({ id: schema.people.id, email: schema.people.email })
    .from(schema.people)
    .where(
      inArray(
        schema.people.email,
        TEAMMATES.map(([name]) => demoEmailOf(name)),
      ),
    );
  await db.delete(schema.welcomerClues).where(
    inArray(
      schema.welcomerClues.personId,
      rows.map(({ id }) => id),
    ),
  );
  await db.insert(schema.welcomerClues).values(
    TEAMMATES.flatMap(([name]) => {
      const personId = rows.find(({ email }) => email === demoEmailOf(name))?.id;
      const numbers = PARTIAL_CLUES[name] ?? CLUE_NUMBERS_TO_WRITE;
      return personId
        ? numbers.map((number) => ({ personId, number, text: CLUES[number as 2 | 3 | 4] }))
        : [];
    }),
  );
}

/** Upserts the five teams and the 20 seeded teammates with filled, visible cards. */
async function seedTeammates(db: SchemaDb): Promise<Map<string, string>> {
  const teamIds = await seedTeams(db);

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
  await seedTeammateClues(db);
  return teamIds;
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
    revealSeen = false,
  }: SeedDemoGameOptions,
): Promise<{ removed: number; startDate: string }> {
  const teamIds = await seedTeammates(db);

  const startDate = addDays(todayInGameZone(new Date()), -(day - 1));
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
  // A teammate welcomes one running mission, so any other the welcomer had makes way.
  await db
    .delete(schema.games)
    .where(and(eq(schema.games.welcomerPersonId, welcomerId), eq(schema.games.status, "active")));

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

  // The album belongs to the person, so the tester gets their row now; sign-in claims it.
  await db
    .insert(schema.people)
    .values({ email: gamePlayerEmail, name: gamePlayerEmail.split("@")[0] ?? gamePlayerEmail })
    .onConflictDoNothing({ target: schema.people.email });
  const [playerRow] = await db
    .select({ id: schema.people.id, clerkUserId: schema.people.clerkUserId })
    .from(schema.people)
    .where(eq(schema.people.email, gamePlayerEmail));
  if (!playerRow) throw new Error("Player row is missing");
  const now = new Date();
  const [game] = await db
    .insert(schema.games)
    .values({
      playerEmail: gamePlayerEmail,
      playerPersonId: playerRow.clerkUserId ? playerRow.id : null,
      welcomerPersonId: welcomerId,
      startDate,
      // A fresh game is the first visit: the welcome tour has not been seen.
      introSeenAt: fresh ? null : now,
      status: outcome,
      foundAt: outcome === "found" ? now : null,
      foundWithClues: outcome === "found" ? lastReadClue : null,
      revealSeenAt: revealSeen || outcome === "found" ? now : null,
      lastReadClue,
    })
    .returning({ id: schema.games.id });
  if (!game) throw new Error("Game insert failed");

  await setWelcomerClues(db, welcomerId, CLUE_NUMBERS_TO_WRITE);
  await snapshotClues(db, game.id, welcomerId);

  const album = { collectorId: playerRow.id, gameId: game.id };
  if (player && !fresh) await seedProgress(db, album, welcomerOption);
  if (outcome === "found") await seedFound(db, album, welcomerId);

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

type AdminBoardMission = {
  name: string;
  email: string;
  /** The player signed in: their people row has a Clerk id and the mission is linked to it. */
  signedIn: boolean;
  /** Clues 2 to 4 they wrote for their own welcomer turn. */
  cluesWritten: number;
  /** Today's game day. */
  day: number;
  welcomer: string;
  /** A seeded teammate who turned it on. */
  addedBy?: string;
  outcome?: "found" | "revealed";
  /** What the player did; none for a mission they have not played. */
  activity?: { collected: number; wrongGuesses: number; idleDays: number };
};

const FOUND_ON_DAY = 8;

// Emails on reserved domains, so no seeded person can ever collide with a real sign-in. Together
// with the seeded teammates, who sign in with a fake Clerk id and have no mission, they cover
// every row of the admin People page: no mission, playing, done, not signed in, and
// people with clues missing.
const ADMIN_BOARD_MISSIONS: readonly AdminBoardMission[] = [
  {
    name: "Priya Shah",
    email: "priya.shah@example.com",
    signedIn: true,
    cluesWritten: 3,
    day: 10,
    welcomer: "Leo Martin",
    addedBy: "Omar Aziz",
    activity: { collected: 12, wrongGuesses: 2, idleDays: 0 },
  },
  {
    name: "Daniel Okoye",
    email: "daniel.okoye@example.com",
    signedIn: true,
    cluesWritten: 3,
    day: 3,
    welcomer: "Sofia Rossi",
    activity: { collected: 3, wrongGuesses: 0, idleDays: 1 },
  },
  {
    name: "Wen Zhang",
    email: "wen.zhang@example.com",
    signedIn: true,
    cluesWritten: 1,
    day: 7,
    welcomer: "Noor Haddad",
    activity: { collected: 2, wrongGuesses: 1, idleDays: 4 },
  },
  {
    name: "Luca Moretti",
    email: "luca.moretti@example.com",
    signedIn: true,
    cluesWritten: 3,
    day: 18,
    welcomer: "Zoe Garcia",
    activity: { collected: 5, wrongGuesses: 0, idleDays: 16 },
  },
  {
    name: "Taylor Brooks",
    email: "taylor.brooks@example.com",
    signedIn: true,
    cluesWritten: 2,
    day: 2,
    welcomer: "Mateo Ruiz",
  },
  {
    name: "Jamie Reyes",
    email: "jamie.reyes@example.com",
    signedIn: true,
    cluesWritten: 0,
    day: 1,
    welcomer: "Ava Patel",
    addedBy: "Omar Aziz",
  },
  {
    name: "Amara Diallo",
    email: "amara.diallo@example.com",
    signedIn: false,
    cluesWritten: 0,
    day: 2,
    welcomer: "Noah Dubois",
  },
  {
    name: "Kofi Mensah",
    email: "kofi.mensah@gmail.example",
    signedIn: false,
    cluesWritten: 0,
    day: 1,
    welcomer: "Chloe Nguyen",
    addedBy: "Inès Moreau",
  },
  {
    name: "Hugo Laurent",
    email: "hugo.laurent@example.com",
    signedIn: true,
    cluesWritten: 3,
    day: 21,
    welcomer: "Ethan Kim",
    outcome: "found",
    activity: { collected: 9, wrongGuesses: 1, idleDays: 20 },
  },
  {
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    signedIn: true,
    cluesWritten: 3,
    day: 21,
    welcomer: "Hana Kim",
    addedBy: "Inès Moreau",
    outcome: "revealed",
    activity: { collected: 7, wrongGuesses: 3, idleDays: 10 },
  },
];

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/** Stickers collected, the first few of them wrong guesses, ending `idleDays` days ago. */
async function seedActivity(
  db: SchemaDb,
  { collectorId, gameId }: { collectorId: string; gameId: string },
  teammateIds: readonly string[],
  { collected, wrongGuesses, idleDays }: NonNullable<AdminBoardMission["activity"]>,
  now: Date,
) {
  const lastActiveAt = now.getTime() - idleDays * DAY_MS;
  const at = (index: number) => new Date(lastActiveAt - index * 10 * MINUTE_MS);
  const picked = teammateIds.slice(0, collected);
  await db.delete(schema.collections).where(eq(schema.collections.collectorPersonId, collectorId));
  if (picked.length > 0) {
    await db.insert(schema.collections).values(
      picked.map((personId, index) => ({
        collectorPersonId: collectorId,
        personId,
        note: "Something they told me.",
        createdAt: at(index),
        updatedAt: at(index),
      })),
    );
  }
  const wrong = picked.slice(0, wrongGuesses);
  if (wrong.length > 0) {
    await db.insert(schema.guesses).values(
      wrong.map((personId, index) => ({
        gameId,
        personId,
        correct: false,
        createdAt: at(index),
      })),
    );
  }
}

/**
 * Dev-only: (re)creates the people and missions that cover every row of the admin People page, on
 * top of the seeded teammates, who all sign in with a fake Clerk id. Only missions for the seeded
 * emails are replaced. Callers must have checked the database is not production.
 */
export async function seedAdminBoard(db: SchemaDb, now: Date): Promise<{ missions: number }> {
  await seedTeammates(db);
  const today = todayInGameZone(now);
  const emails = ADMIN_BOARD_MISSIONS.map(({ email }) => email);
  const teammateEmails = TEAMMATES.map(([name]) => demoEmailOf(name));
  const signedInPeople = ADMIN_BOARD_MISSIONS.filter(({ signedIn }) => signedIn);

  await db
    .update(schema.people)
    .set({ clerkUserId: sql`'seed_' || ${schema.people.email}` })
    .where(and(inArray(schema.people.email, teammateEmails), isNull(schema.people.clerkUserId)));
  await db
    .insert(schema.people)
    .values(
      signedInPeople.map(({ name, email }) => ({ name, email, clerkUserId: `seed_${email}` })),
    )
    .onConflictDoUpdate({
      target: schema.people.email,
      set: { name: sql`excluded.name`, clerkUserId: sql`excluded.clerk_user_id` },
    });

  const rows = await db
    .select({ id: schema.people.id, name: schema.people.name, email: schema.people.email })
    .from(schema.people)
    .where(inArray(schema.people.email, [...teammateEmails, ...emails]));
  const idOf = (email: string) => {
    const id = rows.find((row) => row.email === email)?.id;
    if (!id) throw new Error(`Seeded person ${email} is missing`);
    return id;
  };

  await db.delete(schema.games).where(inArray(schema.games.playerEmail, emails));
  // A teammate welcomes one running mission, so the seeded welcomers' other missions make way.
  const welcomerIds = ADMIN_BOARD_MISSIONS.flatMap(({ welcomer }) =>
    welcomer ? [idOf(demoEmailOf(welcomer))] : [],
  );
  await db
    .delete(schema.games)
    .where(
      and(inArray(schema.games.welcomerPersonId, welcomerIds), eq(schema.games.status, "active")),
    );

  for (const entry of ADMIN_BOARD_MISSIONS) {
    if (entry.signedIn) {
      await setWelcomerClues(
        db,
        idOf(entry.email),
        CLUE_NUMBERS_TO_WRITE.slice(0, entry.cluesWritten),
      );
    }
    const welcomerId = idOf(demoEmailOf(entry.welcomer));
    const startDate = addDays(today, -(entry.day - 1));
    const [game] = await db
      .insert(schema.games)
      .values({
        playerEmail: entry.email,
        playerPersonId: entry.signedIn ? idOf(entry.email) : null,
        welcomerPersonId: welcomerId,
        startDate,
        status: entry.outcome ?? "active",
        foundAt:
          entry.outcome === "found" ? zonedTime(addDays(startDate, FOUND_ON_DAY - 1), 14) : null,
        foundWithClues: entry.outcome === "found" ? 3 : null,
        introSeenAt: now,
        revealSeenAt: entry.outcome ? now : null,
        createdBy: entry.addedBy ? idOf(demoEmailOf(entry.addedBy)) : null,
      })
      .returning({ id: schema.games.id });
    if (!game) throw new Error("Game insert failed");
    // An unfinished mission is what makes someone a new hire; a finished one clears it.
    if (entry.signedIn) {
      await db
        .update(schema.people)
        .set({ newHire: entry.outcome === undefined })
        .where(eq(schema.people.id, idOf(entry.email)));
    }
    await snapshotClues(db, game.id, welcomerId);
    if (entry.activity) {
      const welcomerEmail = demoEmailOf(entry.welcomer);
      const collectable = teammateEmails.filter((email) => email !== welcomerEmail).map(idOf);
      await seedActivity(
        db,
        { collectorId: idOf(entry.email), gameId: game.id },
        collectable,
        entry.activity,
        now,
      );
    }
    if (entry.outcome === "found") {
      await seedFound(db, { collectorId: idOf(entry.email), gameId: game.id }, welcomerId);
    }
  }
  return { missions: ADMIN_BOARD_MISSIONS.length };
}
