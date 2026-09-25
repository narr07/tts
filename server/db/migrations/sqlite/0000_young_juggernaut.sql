CREATE TABLE `puzzles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`clue` text NOT NULL,
	`answer` text NOT NULL,
	`direction` text,
	`row` integer,
	`col` integer,
	`number` integer,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
