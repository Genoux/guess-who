import { sql } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { people } from "./people";

export const gameStatus = pgEnum("game_status", ["active", "found", "revealed"]);

export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Null until the new hire signs in with player_email.
    playerPersonId: uuid("player_person_id").references(() => people.id, {
      onDelete: "restrict",
    }),
    // Stored normalized (trimmed, lowercase), like people.email.
    playerEmail: text("player_email").notNull(),
    welcomerPersonId: uuid("welcomer_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    status: gameStatus("status").notNull().default("active"),
    foundAt: timestamp("found_at", { withTimezone: true }),
    // Player-only progress: when they finished the welcome intro, and the highest clue they opened.
    introSeenAt: timestamp("intro_seen_at", { withTimezone: true }),
    // When the player first saw the welcomer reveal; set by the right guess or on the first open.
    revealSeenAt: timestamp("reveal_seen_at", { withTimezone: true }),
    lastReadClue: smallint("last_read_clue").notNull().default(0),
    // lastReadClue frozen at the find; it keeps rising once the game is over. Null unless found.
    foundWithClues: smallint("found_with_clues"),
    // Null when an integration (Deel) creates the game instead of an admin.
    createdBy: uuid("created_by").references(() => people.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("games_player_email_idx").on(t.playerEmail),
    index("games_player_person_id_idx").on(t.playerPersonId),
    index("games_welcomer_person_id_idx").on(t.welcomerPersonId),
    uniqueIndex("games_active_player_email_unique")
      .on(t.playerEmail)
      .where(sql`${t.status} = 'active'`),
  ],
);
