CREATE TABLE "welcomer_clues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"number" smallint NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "welcomer_clues_number_check" CHECK ("welcomer_clues"."number" between 2 and 4)
);
--> statement-breakpoint
ALTER TABLE "welcomer_clues" ADD CONSTRAINT "welcomer_clues_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "welcomer_clues_person_id_number_unique" ON "welcomer_clues" USING btree ("person_id","number");
--> statement-breakpoint
-- Backfill: each welcomer keeps the clues of their most recent game that has any written.
INSERT INTO "welcomer_clues" ("person_id", "number", "text", "created_at", "updated_at")
SELECT "latest"."person_id", "c"."number", "c"."text", "c"."created_at", "c"."updated_at"
FROM (
	SELECT DISTINCT ON ("g"."welcomer_person_id") "g"."welcomer_person_id" AS "person_id", "g"."id" AS "game_id"
	FROM "games" "g"
	WHERE EXISTS (
		SELECT 1 FROM "clues" "c"
		WHERE "c"."game_id" = "g"."id" AND "c"."number" > 1 AND btrim(coalesce("c"."text", '')) <> ''
	)
	ORDER BY "g"."welcomer_person_id", "g"."created_at" DESC
) "latest"
JOIN "clues" "c" ON "c"."game_id" = "latest"."game_id"
WHERE "c"."number" > 1 AND btrim(coalesce("c"."text", '')) <> '';
