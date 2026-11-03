ALTER TABLE "people" ADD COLUMN "personal_email" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "deel_id" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "auto_mission_done_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "people_personal_email_unique" ON "people" USING btree ("personal_email");--> statement-breakpoint
CREATE UNIQUE INDEX "people_deel_id_unique" ON "people" USING btree ("deel_id");