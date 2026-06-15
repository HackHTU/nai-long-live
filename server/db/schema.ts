import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const comments = sqliteTable(
	"comments",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		authorName: text("author_name").notNull(),
		authorAvatar: text("author_avatar").notNull(),
		body: text("body").notNull(),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [index("comments_created_at_idx").on(table.createdAt)],
);

export const votes = sqliteTable(
	"votes",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		videoId: text("video_id").notNull(),
		authorName: text("author_name").notNull(),
		authorAvatar: text("author_avatar").notNull(),
		createdAt: integer("created_at").notNull(),
		consumedAt: integer("consumed_at"),
	},
	(table) => [
		index("votes_video_id_idx").on(table.videoId),
		index("votes_consumed_at_id_idx").on(table.consumedAt, table.id),
	],
);
