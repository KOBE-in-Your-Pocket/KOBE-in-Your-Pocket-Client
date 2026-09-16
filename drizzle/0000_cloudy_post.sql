CREATE TABLE `evacuation_shelters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`type` text NOT NULL,
	`facility_category` text NOT NULL,
	`image_url` text NOT NULL,
	`capacity` integer,
	`accessible` integer NOT NULL
);
