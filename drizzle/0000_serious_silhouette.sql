CREATE TABLE `giveaways` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`prize` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text DEFAULT '—' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_links` (
	`key` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`youtube_video_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'arsiv' NOT NULL,
	`source` text DEFAULT 'youtube' NOT NULL,
	`source_url` text,
	`storage_key` text,
	`thumbnail_url` text,
	`duration_seconds` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_public_id_unique` ON `videos` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `videos_slug_unique` ON `videos` (`slug`);--> statement-breakpoint
CREATE INDEX `videos_status_sort_idx` ON `videos` (`status`,`sort_order`);