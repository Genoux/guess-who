ALTER TABLE "games" ADD COLUMN "intro_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "last_read_clue" smallint DEFAULT 0 NOT NULL;