ALTER TABLE "people" ADD COLUMN "new_hire" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill, valid while there is no production data: whoever has an unfinished mission is a new hire.
UPDATE "people" SET "new_hire" = true
WHERE "id" IN (
	SELECT "player_person_id" FROM "games"
	WHERE "status" = 'active' AND "player_person_id" IS NOT NULL
);
