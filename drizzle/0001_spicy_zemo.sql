CREATE TABLE "lesson_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "lesson_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "study_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"progress_state" text DEFAULT 'unseen' NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "uq_progress" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "video_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_group_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"embed_url" text,
	"duration_seconds" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_lesson_group_id_lesson_groups_id_fk" FOREIGN KEY ("lesson_group_id") REFERENCES "public"."lesson_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_progress_user" ON "study_progress" USING btree ("user_id","target_type");--> statement-breakpoint
CREATE INDEX "idx_video_group" ON "video_lessons" USING btree ("lesson_group_id","sort_order");