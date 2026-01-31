import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "../../auth/repo/auth.schema";
import { contactSchema } from "../../contact/repo/contact.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum ConversationStatus {
	NEW = "NEW",
	IN_PROGRESS = "IN_PROGRESS",
	RESOLVED = "RESOLVED",
}

export const conversationSchema = pgTable("conversations", {
	...baseColumns(),
	status: varchar({ length: 255 }).notNull().$type<ConversationStatus>(),
	userId: text("user_id")
		.references(() => users.id)
		.notNull(),
	contactId: integer("contact_id")
		.references(() => contactSchema.id)
		.notNull(),
	lastMessageAt: timestamp("last_message_at"),
});

export type ConversationSelectModel = InferSelectModel<
	typeof conversationSchema
>;
export type ConversationInsertModel = InferInsertModel<
	typeof conversationSchema
>;
