CREATE TABLE "mock_exam_attempt_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	CONSTRAINT "uq_attempt_answer" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "mock_exam_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score_total" integer,
	"score_max" integer,
	"status" text DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_exam_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"section_name" text NOT NULL,
	"prompt" text NOT NULL,
	"choices" text NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_exams" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"time_limit_minutes" integer DEFAULT 90 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mock_exam_attempt_answers" ADD CONSTRAINT "mock_exam_attempt_answers_attempt_id_mock_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."mock_exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_exam_attempt_answers" ADD CONSTRAINT "mock_exam_attempt_answers_question_id_mock_exam_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."mock_exam_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_exam_attempts" ADD CONSTRAINT "mock_exam_attempts_exam_id_mock_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."mock_exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_exam_questions" ADD CONSTRAINT "mock_exam_questions_exam_id_mock_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."mock_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attempts_user" ON "mock_exam_attempts" USING btree ("user_id","exam_id");--> statement-breakpoint
CREATE INDEX "idx_questions_exam" ON "mock_exam_questions" USING btree ("exam_id");