CREATE TABLE "grammar_examples" (
	"id" text PRIMARY KEY NOT NULL,
	"grammar_id" text NOT NULL,
	"sentence_ja" text NOT NULL,
	"sentence_en" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_items" (
	"id" text PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"meaning" text NOT NULL,
	"formation" text,
	"usage_notes" text,
	"common_mistakes" text,
	"jlpt_level" text DEFAULT 'N2' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grammar_examples" ADD CONSTRAINT "grammar_examples_grammar_id_grammar_items_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_grammar_examples_grammar_id" ON "grammar_examples" USING btree ("grammar_id");--> statement-breakpoint
CREATE INDEX "idx_grammar_pattern" ON "grammar_items" USING btree ("pattern");