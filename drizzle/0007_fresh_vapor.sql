CREATE TABLE "generated_example_sentences" (
	"id" text PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"prompt_version" text DEFAULT 'v1' NOT NULL,
	"model_name" text NOT NULL,
	"sentence_ja" text NOT NULL,
	"sentence_reading" text,
	"sentence_translation_en" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_gen_source" ON "generated_example_sentences" USING btree ("source_type","source_id");