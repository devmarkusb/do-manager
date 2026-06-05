CREATE TABLE `work_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`state` text NOT NULL,
	`source` text NOT NULL,
	`link` text,
	`last_touched` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
