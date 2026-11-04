CREATE TABLE `live_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`display_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `live_messages_created_idx` ON `live_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `live_presence` (
	`session_id` text PRIMARY KEY NOT NULL,
	`last_seen_at` integer NOT NULL
);
