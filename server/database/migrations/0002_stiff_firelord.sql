ALTER TABLE `team_members` ADD `title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `department` text DEFAULT 'revenue' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `timezone` text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `invited_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `joined_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `team_members_role_idx` ON `team_members` (`role`);--> statement-breakpoint
CREATE INDEX `team_members_department_idx` ON `team_members` (`department`);