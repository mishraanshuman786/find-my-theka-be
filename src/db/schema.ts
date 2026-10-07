import { pgTable,pgEnum, unique, check, serial, varchar, timestamp, index, foreignKey, integer, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const thekaStatusEnum=pgEnum("theka_status",[
"PENDING",
"UNDER_REVIEW",
"VERIFIED",
"REJECTED",
"SUSPENDED"
])


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

export const thekas=pgTable("thekas",{
	id:serial("id").primaryKey().notNull(),
	ownerUserId:integer("owner_user_id").notNull().references(()=> users.id,{
		onDelete:"cascade"
	}),
	name:varchar("name",{length:150}).notNull(),
	contactPhone:varchar("contact_phone",{
		length:20
	}).notNull(),
	address:varchar("address",{
		length:500
	}).notNull(),
	city:varchar("city",{length:100}).notNull(),
	state:varchar("state",{length:100}).notNull(),
	pincode:varchar("pincode",{length:6}).notNull(),
	latitude:numeric("latitude",{
		precision:10,
		scale:7,
	}).notNull(),
	longitude:numeric("longitude",{
		precision:10,
		scale:7
	}).notNull(),
	aadhaarNumber:varchar("aadhaar_number",{
		length:12
	}).notNull(),
	gstNumber:varchar("gst_number",{
		length:15
	}).notNull(),
	licenseNumber:varchar("license_number",{
		length:100
	}).notNull(),
	status:thekaStatusEnum("status").notNull().default("PENDING"),
	createdAt:timestamp("created_at",{
		mode:"string"
	}).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt:timestamp("updated_at",{
		mode:"string"
	}).default(sql`CURRENT_TIMESTAMP`).notNull(),

},(table)=>[
     index("thekas_owner_user_id_idx").on(table.ownerUserId),
	 index("thekas_status_idx").on(table.status),
	 index("thekas_location_idx").on(table.longitude, table.latitude)
]);




