DROP INDEX "idx_search_history_user_type";--> statement-breakpoint
CREATE INDEX "idx_search_history_user_type" ON "search_history" USING btree ("user_id" int4_ops,"record_type");