DELETE FROM "games" WHERE "welcomer_person_id" IS NULL;--> statement-breakpoint
DELETE FROM "people" WHERE "clerk_user_id" IS NULL AND "new_hire" AND NOT EXISTS (SELECT 1 FROM "games" WHERE "games"."player_email" = "people"."email");--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_started_check";--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_unstarted_active_check";--> statement-breakpoint
DROP INDEX "games_active_welcomer_unique";--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "welcomer_person_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "games_active_welcomer_unique" ON "games" USING btree ("welcomer_person_id") WHERE "games"."status" = 'active';