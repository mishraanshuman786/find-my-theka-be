ALTER TABLE "search_history" ADD COLUMN "label" varchar(100);--> statement-breakpoint
ALTER TABLE "search_history" ADD COLUMN "record_type" varchar(20) DEFAULT 'SEARCH' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_search_history_user_type" ON "search_history" USING btree ("user_id" int4_ops);