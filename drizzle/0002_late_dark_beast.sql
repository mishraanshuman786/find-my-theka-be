ALTER TABLE "users" ADD COLUMN "firebase_uid" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_firebase_uid_key" UNIQUE("firebase_uid");