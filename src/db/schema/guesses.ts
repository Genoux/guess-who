import { boolean, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";
import { people } from "./people";

export const guesses = pgTable(
  "guesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    correct: boolean("correct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("guesses_game_id_person_id_unique").on(t.gameId, t.personId),
    index("guesses_person_id_idx").on(t.personId),
  ],
);
