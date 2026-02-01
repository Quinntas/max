import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import { conversationSchema } from "../../conversation/repo/conversation.schema";
import { type MessageInsertModel, messageSchema } from "./message.schema";

export namespace MessageRepo {
	export function getMessages(filters: {
		conversationPid: string;
		userId: string;
		limit: number;
		offset: number;
		sort?: "asc" | "desc";
	}) {
		const orderBy =
			filters.sort === "asc" ? asc(messageSchema.id) : desc(messageSchema.id);

		return db
			.select({
				pid: messageSchema.pid,
				senderType: messageSchema.senderType,
				content: messageSchema.content,
				contentType: messageSchema.contentType,
				createdAt: messageSchema.createdAt,
				updatedAt: messageSchema.updatedAt,
			})
			.from(messageSchema)
			.innerJoin(
				conversationSchema,
				eq(messageSchema.conversationId, conversationSchema.id),
			)
			.where(
				and(
					eq(conversationSchema.pid, filters.conversationPid),
					eq(conversationSchema.userId, filters.userId),
				),
			)
			.orderBy(orderBy)
			.limit(filters.limit)
			.offset(filters.offset);
	}

	export function getAllMessages(filters: {
		conversationPid: string;
		userId: string;
	}) {
		return db
			.select({
				pid: messageSchema.pid,
				senderType: messageSchema.senderType,
				content: messageSchema.content,
				contentType: messageSchema.contentType,
				createdAt: messageSchema.createdAt,
				updatedAt: messageSchema.updatedAt,
			})
			.from(messageSchema)
			.innerJoin(
				conversationSchema,
				eq(messageSchema.conversationId, conversationSchema.id),
			)
			.where(
				and(
					eq(conversationSchema.pid, filters.conversationPid),
					eq(conversationSchema.userId, filters.userId),
				),
			)
			.orderBy(asc(messageSchema.id));
	}

	export async function countMessages(filters: {
		conversationPid: string;
		userId: string;
	}) {
		const [result] = await db
			.select({ value: count() })
			.from(messageSchema)
			.innerJoin(
				conversationSchema,
				eq(messageSchema.conversationId, conversationSchema.id),
			)
			.where(
				and(
					eq(conversationSchema.pid, filters.conversationPid),
					eq(conversationSchema.userId, filters.userId),
				),
			);

		if (!result) {
			throw new Error("Failed to count messages");
		}

		return result.value;
	}

	export function createMessage(data: MessageInsertModel) {
		return db.insert(messageSchema).values(data).returning();
	}
}
