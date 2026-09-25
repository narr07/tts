CREATE TABLE `student_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`time_seconds` integer DEFAULT 0 NOT NULL,
	`is_completed` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`nisn` text NOT NULL,
	`name` text NOT NULL,
	`birth_date` text NOT NULL,
	`grade` integer NOT NULL,
	`school_name` text NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`total_stars` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_nisn_unique` ON `students` (`nisn`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`pin` text NOT NULL,
	`school_name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_email_unique` ON `teachers` (`email`);--> statement-breakpoint
ALTER TABLE `puzzles` ADD `grade` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `puzzles` ADD `subject` text DEFAULT 'Bahasa Indonesia' NOT NULL;--> statement-breakpoint
ALTER TABLE `puzzles` ADD `order_index` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `puzzles` ADD `icon` text DEFAULT 'i-lucide-book-open' NOT NULL;--> statement-breakpoint
ALTER TABLE `puzzles` ADD `teacher_id` text REFERENCES teachers(id);