import { pgTable, unique, serial, varchar, timestamp, index, foreignKey, integer, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const searchHistory = pgTable("search_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	latitude: numeric({ precision: 10, scale:  7 }).notNull(),
	longitude: numeric({ precision: 10, scale:  7 }).notNull(),
	radius: integer().default(5000),
	resultsCount: integer("results_count").default(0),
	searchedAt: timestamp("searched_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_search_history_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "search_history_user_id_fkey"
		}).onDelete("cascade"),
]);
