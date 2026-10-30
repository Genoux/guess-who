ALTER TABLE "games" ADD COLUMN "intro_seen_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "games" SET "intro_seen_at" = "created_at";
