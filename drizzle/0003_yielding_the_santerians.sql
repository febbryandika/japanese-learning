CREATE TABLE "vocabulary_items" (
	"id" text PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"reading" text NOT NULL,
	"meaning" text NOT NULL,
	"part_of_speech" text,
	"jlpt_level" text DEFAULT 'N2' NOT NULL,
	"notes" text,
	"example_sentence_original" text,
	"example_sentence_translation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_vocab_word" ON "vocabulary_items" USING btree ("word");--> statement-breakpoint
CREATE INDEX "idx_vocab_reading" ON "vocabulary_items" USING btree ("reading");