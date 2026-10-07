CREATE TYPE "public"."theka_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "thekas" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"aadhaar_number" varchar(12) NOT NULL,
	"gst_number" varchar(15) NOT NULL,
	"license_number" varchar(100) NOT NULL,
	"status" "theka_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thekas" ADD CONSTRAINT "thekas_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "thekas_owner_user_id_idx" ON "thekas" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "thekas_status_idx" ON "thekas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "thekas_location_idx" ON "thekas" USING btree ("longitude","latitude");