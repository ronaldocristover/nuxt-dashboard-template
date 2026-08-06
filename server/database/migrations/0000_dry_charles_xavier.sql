CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`actor` text NOT NULL,
	`company` text NOT NULL,
	`plan` text NOT NULL,
	`amount` integer,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_at_idx` ON `activity` (`at`);--> statement-breakpoint
CREATE TABLE `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`user_id` text NOT NULL,
	`code` text,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_tokens_user_kind_idx` ON `auth_tokens` (`user_id`,`kind`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`subscriber` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`issued_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoices_issued_at_idx` ON `invoices` (`issued_at`);--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`product_updates` integer DEFAULT true NOT NULL,
	`weekly_digest` integer DEFAULT true NOT NULL,
	`payment_failures` integer DEFAULT true NOT NULL,
	`churn_alerts` integer DEFAULT true NOT NULL,
	`new_signups` integer DEFAULT false NOT NULL,
	`channel` text DEFAULT 'email' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `revenue_history` (
	`kind` text NOT NULL,
	`seq` integer NOT NULL,
	`value` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `revenue_history_kind_seq` ON `revenue_history` (`kind`,`seq`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`mrr` integer NOT NULL,
	`seats` integer NOT NULL,
	`country` text NOT NULL,
	`avatar_color` text NOT NULL,
	`joined_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `subscribers_status_idx` ON `subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `subscribers_plan_idx` ON `subscribers` (`plan`);--> statement-breakpoint
CREATE INDEX `subscribers_mrr_idx` ON `subscribers` (`mrr`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`avatar_color` text NOT NULL,
	`last_seen_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`timezone` text DEFAULT 'Asia/Jakarta' NOT NULL,
	`avatar_color` text NOT NULL,
	`created_at` text NOT NULL,
	`email_verified_at` text,
	`two_factor_enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);