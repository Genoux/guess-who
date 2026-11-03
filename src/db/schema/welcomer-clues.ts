import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { people } from "./people";

// A teammate's own clues 2 to 4, kept across games: the next time they are picked, they are
// already written. A row exists only once the clue has text; clue 1 is generated from their team.
export const welcomerClues = pgTable(
  "welcomer_clues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("welcomer_clues_person_id_number_unique").on(t.personId, t.number),
    check("welcomer_clues_number_check", sql`${t.number} between 2 and 4`),
  ],
);

export type WelcomerClue = typeof welcomerClues.$inferSelect;
