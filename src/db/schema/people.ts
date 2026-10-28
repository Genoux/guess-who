import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { teams } from "./teams";

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id"),
    // Stored normalized (trimmed, lowercase) so games.player_email matches it exactly.
    email: text("email").notNull(),
    name: text("name").notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    location: text("location"),
    fact: text("fact"),
    ask: text("ask"),
    // Profile picture from Clerk: the Slack photo for people who sign in with Slack.
    imageUrl: text("image_url"),
    // Slack member id (U…) from the Slack sign-in, for addressing notifications.
    slackUserId: text("slack_user_id"),
    // The Clerk session the row was last read from; a new sign-in re-reads it.
    syncedSessionId: text("synced_session_id"),
    photoKey: text("photo_key"),
    stickerNumber: integer("sticker_number").notNull().generatedByDefaultAsIdentity(),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("people_clerk_user_id_unique").on(t.clerkUserId),
    uniqueIndex("people_slack_user_id_unique").on(t.slackUserId),
    uniqueIndex("people_email_unique").on(t.email),
    uniqueIndex("people_sticker_number_unique").on(t.stickerNumber),
    index("people_team_id_idx").on(t.teamId),
  ],
);

export type Person = typeof people.$inferSelect;
