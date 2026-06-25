CREATE TABLE "epub_books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"file_url" text NOT NULL,
	"cover_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"cfi" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_reader_progress" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "reader_progress" ADD CONSTRAINT "reader_progress_book_id_epub_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."epub_books"("id") ON DELETE cascade ON UPDATE no action;