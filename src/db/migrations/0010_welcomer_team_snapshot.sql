ALTER TABLE "games" ADD COLUMN "welcomer_team_name" text;--> statement-breakpoint
-- Backfill, valid while there is no production data: a started mission keeps the team its
-- welcomer has today, which is the best the past offers.
UPDATE "games" SET "welcomer_team_name" = "teams"."name"
FROM "people" JOIN "teams" ON "teams"."id" = "people"."team_id"
WHERE "people"."id" = "games"."welcomer_person_id";
