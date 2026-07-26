CREATE TABLE `community_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`category` text DEFAULT 'tartisma' NOT NULL,
	`display_name` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`parent_id`) REFERENCES `community_messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_messages_status_created_idx` ON `community_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_messages_parent_status_idx` ON `community_messages` (`parent_id`,`status`);
