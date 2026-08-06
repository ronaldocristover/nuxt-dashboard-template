CREATE TABLE `board_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`column_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`account` text NOT NULL,
	`mrr` integer DEFAULT 0 NOT NULL,
	`owner_name` text NOT NULL,
	`owner_color` text NOT NULL,
	`due_at` text,
	`labels` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`column_id`) REFERENCES `board_columns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `board_cards_column_position_idx` ON `board_cards` (`column_id`,`position`);--> statement-breakpoint
CREATE TABLE `board_columns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	`tone` text DEFAULT 'neutral' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `board_columns_position_idx` ON `board_columns` (`position`);