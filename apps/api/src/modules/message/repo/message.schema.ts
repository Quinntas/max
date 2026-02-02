import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, integer, pgTable, text, varchar, vector } from "drizzle-orm/pg-core";
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

export const messageSchema = pgTable(
	"messages",
	{
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

		normalizedText: text("normalized_text"),
		embedding: vector("embedding", { dimensions: 768 }),
	},
	(table) => [
		index("message_embedding_index").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops"),
		),
	],
);

export type MessageSelectModel = InferSelectModel<typeof messageSchema>;
export type MessageInsertModel = InferInsertModel<typeof messageSchema>;

export type PublicMessage = Omit<MessageSelectModel, "id" | "conversationId"> & {
	conversationPid: string;
};
