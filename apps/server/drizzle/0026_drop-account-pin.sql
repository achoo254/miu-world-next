ALTER TABLE "parents" DROP COLUMN "pin_hash";--> statement-breakpoint
ALTER TABLE "parents" DROP COLUMN "pin_failed_count";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "parent_gate_until";