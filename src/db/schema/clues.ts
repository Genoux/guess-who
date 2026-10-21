import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";

export const clues = pgTable(
  "clues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    // Null until written. Clue 1 is the welcomer's team; the welcomer writes 2 to 4.
    text: text("text"),
    releaseAt: timestamp("release_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("clues_game_id_number_unique").on(t.gameId, t.number),
    check("clues_number_check", sql`${t.number} between 1 and 4`),
  ],
);
