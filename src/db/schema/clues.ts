import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";

// The welcomer's clues 2 to 4 as they were when the player pressed Start. The player's board and
// reveal read these, so a welcomer who edits their clues later never changes what a player saw.
// Clue 1 is generated from the welcomer's team and has no row.
export const clues = pgTable(
  "clues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("clues_game_id_number_unique").on(t.gameId, t.number),
    check("clues_number_check", sql`${t.number} between 2 and 4`),
  ],
);
