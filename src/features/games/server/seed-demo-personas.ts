import "server-only";
import { inArray, or, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { seedTeams } from "@/db/seed-teams";
import { addDays, todayInGameZone, zonedTime } from "@/entities/game-schedule";
import { avatarUrlOf, DEMO_CAST, DEMO_PERSONAS, demoCastEmail } from "./demo-cast";
import { snapshotClues } from "./seed-demo-game";

type SchemaDb = NeonDatabase<typeof schema>;

const CLUE_NUMBERS = [2, 3, 4] as const;

const personaOf = (key: (typeof DEMO_PERSONAS)[number]["key"]) => {
  const found = DEMO_PERSONAS.find((persona) => persona.key === key);
  if (!found) throw new Error(`Unknown persona ${key}`);
  return found;
};

const EMPTY_CARD = { teamId: null, location: null, fact: null, ask: null } as const;

const FILLED_CARD = (teamId: string | undefined, location: string) => ({
  teamId,
  location,
  fact: "Has a drawer of mismatched socks, on purpose.",
  ask: "The best poutine in town",
});

// What the player persona learned: eight cast members, two kept on the maybe list.
const PLAYER_COLLECTED = [
  ["Mateo Ruiz", "Owns more records than plates, and lends them out."],
  ["Noor Haddad", "Rates the croissants of every city she visits."],
  ["Jonah Park", "Keeps a spreadsheet of every meal since 2019."],
  ["Maya Chen", "Runs a supper club every second Friday."],
  ["Ben Carter", "Smokes brisket for fourteen hours and will not be rushed."],
  ["Grace Liu", "Writes a tiny newsletter about spreadsheet shortcuts."],
  ["Theo Lindqvist", "Restores seventies bicycles in his hallway."],
  ["Sofia Rossi", "Collects board games with very long rules."],
] as const;
const PLAYER_MAYBES = ["Mateo Ruiz", "Maya Chen"] as const;
const PLAYER_WRONG_GUESS = "Jonah Park";

type PersonRow = { id: string; email: string };

/** The id of the people row that already exists for an email, if any. */
export const linkedPersonId = (rows: readonly PersonRow[], email: string): string | null =>
  rows.find((row) => row.email === email)?.id ?? null;

/**
 * Dev-only, idempotent: builds about 25 complete fake teammates (card, three clues, a local
 * portrait) and six sign-in personas on Clerk test emails, each in one state of the game. Running
 * it again resets every demo state. Callers must have checked the database is not production.
 */
export async function seedDemoPersonas(db: SchemaDb, now: Date) {
  const teamIds = await seedTeams(db);
  const teamId = (name: string) => {
    const id = teamIds.get(name);
    if (!id) throw new Error(`Team ${name} is missing`);
    return id;
  };

  // The cast: signed in as far as the admin page can tell, so they show up under No mission.
  await db
    .insert(schema.people)
    .values(
      DEMO_CAST.map(({ name, team, location, fact, ask }) => ({
        name,
        email: demoCastEmail(name),
        imageUrl: avatarUrlOf(name),
        teamId: teamId(team),
        location,
        fact,
        ask,
        hidden: false,
        clerkUserId: `seed_${demoCastEmail(name)}`,
      })),
    )
    .onConflictDoUpdate({
      target: schema.people.email,
      set: {
        name: sqlExcluded("name"),
        imageUrl: sqlExcluded("image_url"),
        teamId: sqlExcluded("team_id"),
        location: sqlExcluded("location"),
        fact: sqlExcluded("fact"),
        ask: sqlExcluded("ask"),
        hidden: false,
        newHire: false,
        clerkUserId: sql`coalesce(${schema.people.clerkUserId}, excluded.clerk_user_id)`,
      },
    });

  // Personas: rows by email, so the first Clerk sign-in links the row instead of creating one, as
  // adding a new hire does. The new hires, the player among them, carry the flag and an empty card; the done persona's
  // flag is cleared, as ending a mission does, and its card is deliberately empty too.
  const personaCard = {
    welcomer: FILLED_CARD(teamId("Strategy"), "Toronto"),
    teammate: FILLED_CARD(teamId("Creative"), "Lisbon"),
    admin: FILLED_CARD(teamId("Ops"), "Montreal"),
    player: EMPTY_CARD,
    done: EMPTY_CARD,
    newhire: EMPTY_CARD,
    lockedhire: EMPTY_CARD,
  } as const;
  for (const { key, name, email, newHire } of DEMO_PERSONAS) {
    const card = personaCard[key as keyof typeof personaCard];
    await db
      .insert(schema.people)
      .values({ name, email, imageUrl: avatarUrlOf(name), hidden: false, newHire, ...card })
      .onConflictDoUpdate({
        target: schema.people.email,
        set: { name, imageUrl: avatarUrlOf(name), hidden: false, newHire, ...card },
      });
  }

  const emails = [
    ...DEMO_CAST.map(({ name }) => demoCastEmail(name)),
    ...DEMO_PERSONAS.map(({ email }) => email),
  ];
  const rows = await db
    .select({
      id: schema.people.id,
      email: schema.people.email,
      clerkUserId: schema.people.clerkUserId,
    })
    .from(schema.people)
    .where(inArray(schema.people.email, emails));
  const row = (email: string) => {
    const found = rows.find((candidate) => candidate.email === email);
    if (!found) throw new Error(`Demo person ${email} is missing`);
    return found;
  };
  const castId = (name: string) => row(demoCastEmail(name)).id;
  const personaRow = (key: Parameters<typeof personaOf>[0]) => row(personaOf(key).email);
  // A game is linked to the person's row as soon as one exists, signed in or not, so a re-seed
  // never leaves a persona who already signed in with an unlinked game.
  const linkedId = (key: Parameters<typeof personaOf>[0]) =>
    linkedPersonId(rows, personaOf(key).email);

  // Clues: every cast member and the personas who can welcome have all three; the others none.
  const withClues = [
    ...DEMO_CAST.map(({ name, clues }) => ({ id: castId(name), clues })),
    ...(["welcomer", "teammate", "admin"] as const).map((key) => ({
      id: personaRow(key).id,
      clues: [
        "Has a drawer of mismatched socks.",
        "Knows the best poutine in town.",
        "Is hard to catch at their desk.",
      ],
    })),
  ];
  const personaIds = DEMO_PERSONAS.map(({ key }) => personaRow(key).id);
  const allIds = [...DEMO_CAST.map(({ name }) => castId(name)), ...personaIds];
  await db.delete(schema.welcomerClues).where(inArray(schema.welcomerClues.personId, allIds));
  await db
    .insert(schema.welcomerClues)
    .values(
      withClues.flatMap(({ id, clues }) =>
        CLUE_NUMBERS.map((number, index) => ({ personId: id, number, text: clues[index] ?? "" })),
      ),
    );

  // Reset: no demo game survives, and a welcomer is free of any other running mission.
  const welcomerOfPlayer = castId("Ana Souza");
  const welcomerOfDone = castId("Zoe Garcia");
  const welcomerOfNewhire = castId("Ben Carter");
  const playerOfWelcomer = castId("Lea Dubois");
  await db
    .delete(schema.games)
    .where(
      or(
        inArray(schema.games.playerEmail, emails),
        inArray(schema.games.welcomerPersonId, [
          ...personaIds,
          welcomerOfPlayer,
          welcomerOfDone,
          welcomerOfNewhire,
        ]),
      ),
    );
  await db
    .delete(schema.collections)
    .where(inArray(schema.collections.collectorPersonId, personaIds));

  const today = todayInGameZone(now);
  const adminId = personaRow("admin").id;

  // New hire: day 1 with a welcomer, the welcome tour not seen yet.
  const [newhireGame] = await db
    .insert(schema.games)
    .values({
      playerEmail: personaOf("newhire").email,
      playerPersonId: linkedId("newhire"),
      welcomerPersonId: welcomerOfNewhire,
      startDate: today,
      createdBy: adminId,
    })
    .returning({ id: schema.games.id });
  if (!newhireGame) throw new Error("New hire game insert failed");
  await snapshotClues(db, newhireGame.id, welcomerOfNewhire);

  // Player: day 9, so clues 1 to 3 are out.
  const [playerGame] = await db
    .insert(schema.games)
    .values({
      playerEmail: personaOf("player").email,
      playerPersonId: linkedId("player"),
      welcomerPersonId: welcomerOfPlayer,
      startDate: addDays(today, -8),
      introSeenAt: now,
      lastReadClue: 2,
      createdBy: adminId,
    })
    .returning({ id: schema.games.id });
  if (!playerGame) throw new Error("Player game insert failed");
  await snapshotClues(db, playerGame.id, welcomerOfPlayer);
  const playerId = personaRow("player").id;
  await db.insert(schema.collections).values(
    PLAYER_COLLECTED.map(([name, note], index) => ({
      collectorPersonId: playerId,
      personId: castId(name),
      note,
      createdAt: new Date(now.getTime() - (index + 1) * 3_600_000),
    })),
  );
  await db
    .insert(schema.shortlists)
    .values(PLAYER_MAYBES.map((name) => ({ gameId: playerGame.id, personId: castId(name) })));
  await db
    .insert(schema.guesses)
    .values({ gameId: playerGame.id, personId: castId(PLAYER_WRONG_GUESS), correct: false });

  // Welcomer: secretly welcoming Lea Dubois, who is on day 5; the welcomer's clues are locked.
  const welcomerId = personaRow("welcomer").id;
  const [welcomedGame] = await db
    .insert(schema.games)
    .values({
      playerEmail: demoCastEmail("Lea Dubois"),
      playerPersonId: playerOfWelcomer,
      welcomerPersonId: welcomerId,
      startDate: addDays(today, -4),
      introSeenAt: now,
      createdBy: adminId,
    })
    .returning({ id: schema.games.id });
  if (!welcomedGame) throw new Error("Welcomed game insert failed");
  await snapshotClues(db, welcomedGame.id, welcomerId);

  // Done: found on day 8 with two clues, card not done.
  const doneStart = addDays(today, -20);
  const [doneGame] = await db
    .insert(schema.games)
    .values({
      playerEmail: personaOf("done").email,
      playerPersonId: linkedId("done"),
      welcomerPersonId: welcomerOfDone,
      startDate: doneStart,
      status: "found",
      foundAt: zonedTime(addDays(doneStart, 7), 14),
      foundWithClues: 2,
      introSeenAt: now,
      revealSeenAt: now,
      lastReadClue: 3,
      createdBy: adminId,
    })
    .returning({ id: schema.games.id });
  if (!doneGame) throw new Error("Done game insert failed");
  await snapshotClues(db, doneGame.id, welcomerOfDone);
  const doneId = personaRow("done").id;
  await db
    .insert(schema.collections)
    .values(
      [welcomerOfDone, castId("Mateo Ruiz"), castId("Noor Haddad"), castId("Sam Taylor")].map(
        (personId) => ({ collectorPersonId: doneId, personId, note: "Something they told me." }),
      ),
    );
  await db
    .insert(schema.guesses)
    .values({ gameId: doneGame.id, personId: welcomerOfDone, correct: true });

  return {
    cast: DEMO_CAST.length,
    personas: DEMO_PERSONAS.map(({ email, state, opens }) => ({ email, state, opens })),
  };
}

function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}
