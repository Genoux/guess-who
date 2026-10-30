ALTER TABLE "collections" ADD COLUMN "collector_person_id" uuid;--> statement-breakpoint
-- Backfill: the album belongs to the person who played the game it was collected in.
UPDATE "collections" SET "collector_person_id" = "games"."player_person_id"
FROM "games" WHERE "games"."id" = "collections"."game_id";--> statement-breakpoint
-- A game with no linked player cannot hold a collection; one person kept two games, so the
-- oldest collection of each (collector, person) pair wins.
DELETE FROM "collections" WHERE "collector_person_id" IS NULL;--> statement-breakpoint
DELETE FROM "collections" USING "collections" "older"
WHERE "older"."collector_person_id" = "collections"."collector_person_id"
	AND "older"."person_id" = "collections"."person_id"
	AND ("older"."created_at", "older"."id") < ("collections"."created_at", "collections"."id");--> statement-breakpoint
ALTER TABLE "collections" ALTER COLUMN "collector_person_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" DROP CONSTRAINT "collections_game_id_games_id_fk";--> statement-breakpoint
DROP INDEX "collections_game_id_person_id_unique";--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "game_id";--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_collector_person_id_people_id_fk" FOREIGN KEY ("collector_person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_collector_person_id_person_id_unique" ON "collections" USING btree ("collector_person_id","person_id");
