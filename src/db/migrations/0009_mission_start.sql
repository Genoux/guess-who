ALTER TABLE "clues" DROP CONSTRAINT "clues_number_check";--> statement-breakpoint
DROP INDEX "games_player_email_idx";--> statement-breakpoint
DROP INDEX "games_player_person_id_idx";--> statement-breakpoint
DROP INDEX "games_active_player_email_unique";--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "welcomer_person_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
-- Backfill, valid while there is no production data. A game that has not reached day 1 becomes a
-- not-started mission: the welcomer is picked when the player presses Start.
UPDATE "games" SET "welcomer_person_id" = NULL, "start_date" = NULL
WHERE "status" = 'active' AND "start_date" > (now() AT TIME ZONE 'America/Toronto')::date;--> statement-breakpoint
-- One mission per person: the newest game of each email and each linked player stays.
DELETE FROM "games" USING "games" "newer"
WHERE "newer"."player_email" = "games"."player_email"
	AND ("newer"."created_at", "newer"."id") > ("games"."created_at", "games"."id");--> statement-breakpoint
DELETE FROM "games" USING "games" "newer"
WHERE "games"."player_person_id" IS NOT NULL
	AND "newer"."player_person_id" = "games"."player_person_id"
	AND ("newer"."created_at", "newer"."id") > ("games"."created_at", "games"."id");--> statement-breakpoint
-- A person welcomes one running mission: older ones go back to not started.
UPDATE "games" SET "welcomer_person_id" = NULL, "start_date" = NULL
FROM "games" "newer"
WHERE "games"."status" = 'active' AND "newer"."status" = 'active'
	AND "games"."welcomer_person_id" IS NOT NULL
	AND "newer"."welcomer_person_id" = "games"."welcomer_person_id"
	AND ("newer"."created_at", "newer"."id") > ("games"."created_at", "games"."id");--> statement-breakpoint
ALTER TABLE "clues" DROP COLUMN "release_at";--> statement-breakpoint
-- The per-game clues were a legacy table; they are now the snapshot taken at Start.
DELETE FROM "clues";--> statement-breakpoint
INSERT INTO "clues" ("game_id", "number", "text")
SELECT "games"."id", "welcomer_clues"."number", "welcomer_clues"."text"
FROM "games"
JOIN "welcomer_clues" ON "welcomer_clues"."person_id" = "games"."welcomer_person_id"
WHERE btrim("welcomer_clues"."text") <> '';--> statement-breakpoint
ALTER TABLE "clues" ALTER COLUMN "text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "intro_seen_at";--> statement-breakpoint
CREATE UNIQUE INDEX "games_player_email_unique" ON "games" USING btree ("player_email");--> statement-breakpoint
CREATE UNIQUE INDEX "games_player_person_id_unique" ON "games" USING btree ("player_person_id") WHERE "games"."player_person_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "games_active_welcomer_unique" ON "games" USING btree ("welcomer_person_id") WHERE "games"."status" = 'active' and "games"."welcomer_person_id" is not null;--> statement-breakpoint
ALTER TABLE "clues" ADD CONSTRAINT "clues_number_check" CHECK ("clues"."number" between 2 and 4);--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_started_check" CHECK (("games"."welcomer_person_id" is null) = ("games"."start_date" is null));--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_unstarted_active_check" CHECK ("games"."welcomer_person_id" is not null or "games"."status" = 'active');
