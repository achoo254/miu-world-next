ALTER TABLE "sessions" ADD COLUMN "reauth_at" timestamp with time zone;--> statement-breakpoint
UPDATE "child_profiles" SET "voice_chat_allowed" = false WHERE "is_primary" = false;