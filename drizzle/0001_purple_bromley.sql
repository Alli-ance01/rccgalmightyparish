CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`actionLabel` varchar(80),
	`actionUrl` varchar(1024),
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`registrationUrl` varchar(1024),
	`coverImageUrl` varchar(1024),
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`altText` varchar(255),
	`mediaType` enum('image','video','document') NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ministryPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`audience` enum('main','junior') NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`leaderName` varchar(160),
	`leaderRole` varchar(160),
	`meetingInfo` varchar(255),
	`heroImageUrl` varchar(1024),
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ministryPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `ministryPages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`coverImageUrl` varchar(1024),
	`authorName` varchar(160) NOT NULL,
	`publishedAt` timestamp,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sermons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`speaker` varchar(160) NOT NULL,
	`series` varchar(160) NOT NULL,
	`videoProvider` enum('youtube','vimeo','none') NOT NULL DEFAULT 'none',
	`videoId` varchar(255),
	`sermonNotesTitle` varchar(255),
	`sermonNotesUrl` varchar(1024),
	`coverImageUrl` varchar(1024),
	`publishedAt` timestamp,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sermons_id` PRIMARY KEY(`id`),
	CONSTRAINT `sermons_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','member','worker','ministry_leader','editor','admin') NOT NULL DEFAULT 'member';