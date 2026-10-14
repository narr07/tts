CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`banned` integer DEFAULT false,
	`banReason` text,
	`banExpires` integer,
	`nisn` text,
	`birthDate` text,
	`grade` integer DEFAULT 1,
	`schoolName` text DEFAULT '',
	`totalXp` integer DEFAULT 0,
	`totalStars` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
-- D1 mengabaikan PRAGMA foreign_keys, jadi DROP TABLE puzzles bisa ikut menghapus questions dan
-- student_progress lewat ON DELETE CASCADE. Keduanya dicadangkan dulu lalu dikembalikan.
CREATE TABLE `__bak_questions` AS SELECT * FROM `questions`;--> statement-breakpoint
CREATE TABLE `__bak_student_progress` AS SELECT * FROM `student_progress`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_puzzles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`grade` integer DEFAULT 1 NOT NULL,
	`subject` text DEFAULT 'Bahasa Indonesia' NOT NULL,
	`order_index` integer DEFAULT 1 NOT NULL,
	`icon` text DEFAULT 'i-lucide-book-open' NOT NULL,
	`teacher_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_puzzles`("id", "title", "description", "grade", "subject", "order_index", "icon", "teacher_id", "created_at", "updated_at") SELECT "id", "title", "description", "grade", "subject", "order_index", "icon", "teacher_id", "created_at", "updated_at" FROM `puzzles`;--> statement-breakpoint
DROP TABLE `puzzles`;--> statement-breakpoint
ALTER TABLE `__new_puzzles` RENAME TO `puzzles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_student_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`time_seconds` integer DEFAULT 0 NOT NULL,
	`is_completed` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_student_progress`("id", "student_id", "puzzle_id", "score", "stars", "time_seconds", "is_completed", "completed_at") SELECT "id", "student_id", "puzzle_id", "score", "stars", "time_seconds", "is_completed", "completed_at" FROM `__bak_student_progress`;--> statement-breakpoint
DROP TABLE `student_progress`;--> statement-breakpoint
ALTER TABLE `__new_student_progress` RENAME TO `student_progress`;--> statement-breakpoint
DELETE FROM `questions`;--> statement-breakpoint
INSERT INTO `questions` SELECT * FROM `__bak_questions`;--> statement-breakpoint
DROP TABLE `__bak_questions`;--> statement-breakpoint
DROP TABLE `__bak_student_progress`;--> statement-breakpoint
ALTER TABLE `teachers` ADD `role` text DEFAULT 'teacher' NOT NULL;