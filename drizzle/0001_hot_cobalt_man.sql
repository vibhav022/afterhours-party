CREATE TABLE `rate_limits` (
	`scope` text NOT NULL,
	`client_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`scope`, `client_key`, `window_start`)
);
