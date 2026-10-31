CREATE TABLE "daily_quests" (
	"child_id" uuid PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"quest_id" text NOT NULL,
	"done_day" date,
	"streak" integer DEFAULT 0 NOT NULL,
	"best" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_quests_streak_valid" CHECK ("daily_quests"."streak" >= 0 and "daily_quests"."best" >= "daily_quests"."streak")
);
--> statement-breakpoint
ALTER TABLE "parents" ADD COLUMN "is_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_quests" ADD CONSTRAINT "daily_quests_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parents_guest_created_idx" ON "parents" USING btree ("created_at") WHERE "parents"."is_guest";