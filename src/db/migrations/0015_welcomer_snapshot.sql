ALTER TABLE "games" DROP CONSTRAINT "games_welcomer_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "welcomer_person_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "welcomer_name" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "welcomer_image_url" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "welcomer_left_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_welcomer_person_id_people_id_fk" FOREIGN KEY ("welcomer_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "games" SET "welcomer_name" = "people"."name", "welcomer_image_url" = "people"."image_url"
FROM "people"
WHERE "people"."id" = "games"."welcomer_person_id";--> statement-breakpoint
UPDATE "games" SET "player_person_id" = "people"."id"
FROM "people"
WHERE "games"."player_person_id" IS NULL
AND "people"."email" = "games"."player_email"
AND NOT EXISTS (SELECT 1 FROM "games" "g2" WHERE "g2"."player_person_id" = "people"."id");
