import { pgTable, unique, check, serial, varchar, timestamp, index, foreignKey, integer, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }),
	password: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	firebaseUid: varchar("firebase_uid", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_email_key").on(table.email),
	unique("users_phone_key").on(table.phone),
	unique("users_firebase_uid_key").on(table.firebaseUid),
	check( "users_identity_check", sql`email IS NOT NULL OR phone IS NOT NULL OR firebase_uid IS NOT NULL` ),
]);

export const passwordResetOtps=pgTable(
	"password_reset_otps",
	{
		id:serial().primaryKey().notNull(),
		userId:integer("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
		otpHash:varchar("otp_hash",{length:255}).notNull(),
		expiresAt:timestamp("expires_at",{
			mode:"string"
		}).notNull(),
		attempts:integer().notNull().default(0),
		usedAt:timestamp("used_at",{
			mode:"string"
		}),
		createdAt:timestamp("created_at",{
			mode:"string"
		}).default(sql`CURRENT_TIMESTAMP`),

	},
	(table)=>[
      index("idx_password_reset_otps_user").on(table.userId),
	]
)

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
