CREATE TABLE `giveaway_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`giveaway_id` integer NOT NULL,
	`participant_name` text NOT NULL,
	`email` text NOT NULL,
	`youtube_confirmed` integer DEFAULT false NOT NULL,
	`whatsapp_confirmed` integer DEFAULT false NOT NULL,
	`terms_accepted` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'eligible' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`giveaway_id`) REFERENCES `giveaways`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `giveaway_entries_giveaway_email_unique` ON `giveaway_entries` (`giveaway_id`,`email`);
--> statement-breakpoint
CREATE INDEX `giveaway_entries_giveaway_status_idx` ON `giveaway_entries` (`giveaway_id`,`status`);
