import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { conversationSchema } from "../../conversation/repo/conversation.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum MesssageSenderType {
	COSTUMER = "COSTUMER",
	HUMAN_AGENT = "HUMAN_AGENT",
	AI_AGENT = "AI_AGENT",
}

export enum MessageContentType {
	TEXT = "TEXT",
}

export const messageSchema = pgTable("messages", {
	...baseColumns(),
	conversationId: integer("conversationId")
		.references(() => conversationSchema.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		})
		.notNull(),

	senderType: varchar("sender_type", {
		length: 255,
	})
		.notNull()
		.$type<MesssageSenderType>(),

	content: text().notNull(),
	contentType: varchar("content_type", {
		length: 255,
	})
		.notNull()
		.$type<MessageContentType>(),
});

export type MessageSelectModel = InferSelectModel<typeof messageSchema>;
export type MessageInsertModel = InferInsertModel<typeof messageSchema>;

export type PublicMessage = Omit<MessageSelectModel, 'id' | 'conversationId'> & {
  conversationPid: string
}
