CREATE TABLE "kanji_items" (
	"id" text PRIMARY KEY NOT NULL,
	"character" text NOT NULL,
	"onyomi" text,
	"kunyomi" text,
	"meaning" text NOT NULL,
	"stroke_count" integer,
	"jlpt_level" text DEFAULT 'N2' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kanji_items_character_unique" UNIQUE("character")
);
--> statement-breakpoint
CREATE INDEX "idx_kanji_character" ON "kanji_items" USING btree ("character");