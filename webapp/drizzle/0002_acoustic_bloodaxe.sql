ALTER TABLE "pg-drizzle_videos" ADD COLUMN "diarization_completed_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "diarization_total_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "translation_completed_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "translation_total_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "tts_completed_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "tts_total_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "reconstruction_completed_tasks" integer;--> statement-breakpoint
ALTER TABLE "pg-drizzle_videos" ADD COLUMN "reconstruction_total_tasks" integer;