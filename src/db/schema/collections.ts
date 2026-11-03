import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { people } from "./people";

// The album belongs to the person who collects, not to a game: it outlives any mission.
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectorPersonId: uuid("collector_person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    // Collector-only: never shown to anyone else, admins included.
    note: text("note"),
    chatKind: text("chat_kind"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("collections_collector_person_id_person_id_unique").on(
      t.collectorPersonId,
      t.personId,
    ),
    index("collections_person_id_idx").on(t.personId),
  ],
);
