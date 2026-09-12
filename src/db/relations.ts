import { relations } from "drizzle-orm/relations";
import { users, searchHistory } from "./schema";

export const searchHistoryRelations = relations(searchHistory, ({one}) => ({
	user: one(users, {
		fields: [searchHistory.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	searchHistories: many(searchHistory),
}));