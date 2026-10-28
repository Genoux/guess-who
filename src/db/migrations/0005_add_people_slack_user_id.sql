ALTER TABLE "people" ADD COLUMN "slack_user_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "people_slack_user_id_unique" ON "people" USING btree ("slack_user_id");