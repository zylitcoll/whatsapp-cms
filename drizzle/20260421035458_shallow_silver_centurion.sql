CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" text NOT NULL,
	"changes" json,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canned_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"shortcut" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "canned_responses_shortcut_unique" UNIQUE("shortcut")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"display_name" text,
	"profile_picture_url" text,
	"label" varchar(50) DEFAULT 'other' NOT NULL,
	"last_message_at" timestamp,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "media_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"media_id" text NOT NULL,
	"media_type" varchar(50) NOT NULL,
	"local_url" text NOT NULL,
	"meta_url" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"content" json NOT NULL,
	"direction" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"timestamp" integer NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"variables" json NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"meta_template_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "canned_responses_shortcut_idx" ON "canned_responses" USING btree ("shortcut");--> statement-breakpoint
CREATE INDEX "canned_responses_category_idx" ON "canned_responses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "contacts_phone_number_idx" ON "contacts" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "contacts_label_idx" ON "contacts" USING btree ("label");--> statement-breakpoint
CREATE INDEX "media_cache_media_id_idx" ON "media_cache" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "media_cache_expires_at_idx" ON "media_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "messages_contact_id_idx" ON "messages" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "templates_name_idx" ON "templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "templates_is_approved_idx" ON "templates" USING btree ("is_approved");