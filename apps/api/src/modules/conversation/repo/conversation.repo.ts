import { and, asc, count, desc, eq, sql, getTableColumns } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import { users } from "../../auth/repo/auth.schema";
import { contactSchema } from "../../contact/repo/contact.schema";
import {
	type ConversationInsertModel,
	ConversationStatus,
	conversationSchema,
} from "./conversation.schema";
import { messageSchema } from "../../message/repo/message.schema";

export namespace ConversationRepo {
	export function getConversations(filters: {
		userId: string;
		contactPid?: string;
		status?: ConversationStatus;
		limit?: number;
		offset?: number;
		sort?: "asc" | "desc";
	}) {
		const conditions = [eq(conversationSchema.userId, filters.userId)];

		if (filters.contactPid) {
			conditions.push(eq(contactSchema.pid, filters.contactPid));
		}

		if (filters.status) {
			conditions.push(eq(conversationSchema.status, filters.status));
		}

		const orderBy =
			filters.sort === "asc"
				? asc(conversationSchema.id)
				: desc(conversationSchema.id);

		const latestMessages = db.$with("latest_messages").as(
			db.select({
				...getTableColumns(messageSchema),
				rn: sql<number>`row_number() OVER (PARTITION BY ${messageSchema.conversationId} ORDER BY ${messageSchema.createdAt} DESC, ${messageSchema.id} DESC)`.as('rn')
			})
			.from(messageSchema)
		);

		const query = db
			.with(latestMessages)
 			.select({
 				conversation: conversationSchema,
 				user: users,
 				contact: contactSchema,
 				lastMessage: {
 					id: latestMessages.id,
 					pid: latestMessages.pid,
 					conversationId: latestMessages.conversationId,
 					senderType: latestMessages.senderType,
 					content: latestMessages.content,
 					contentType: latestMessages.contentType,
 					normalizedText: latestMessages.normalizedText,
 					embedding: latestMessages.embedding,
 					createdAt: latestMessages.createdAt,
 					updatedAt: latestMessages.updatedAt,
 				},
 			})
			.from(conversationSchema)
			.innerJoin(users, eq(conversationSchema.userId, users.id))
			.innerJoin(
				contactSchema,
				eq(conversationSchema.contactId, contactSchema.id),
			)
			.leftJoin(
				latestMessages,
				and(
					eq(latestMessages.conversationId, conversationSchema.id),
					eq(latestMessages.rn, 1)
				)
			)
			.where(and(...conditions))
			.orderBy(orderBy);

		if (filters.limit !== undefined) {
			query.limit(filters.limit);
		}

		if (filters.offset !== undefined) {
			query.offset(filters.offset);
		}

		return query;
	}

	export async function countConversations(filters: {
		userId: string;
		contactPid?: string;
		status?: ConversationStatus;
	}) {
		const conditions = [eq(conversationSchema.userId, filters.userId)];

		if (filters.contactPid) {
			conditions.push(eq(contactSchema.pid, filters.contactPid));
		}

		if (filters.status) {
			conditions.push(eq(conversationSchema.status, filters.status));
		}

		const [result] = await db
			.select({ value: count() })
			.from(conversationSchema)
			.innerJoin(
				contactSchema,
				eq(conversationSchema.contactId, contactSchema.id),
			)
			.where(and(...conditions));

		if (!result) {
			throw new Error("Failed to count conversations");
		}

		return result.value;
	}

	export function getConversationByPid(pid: string, userId: string) {
		return db
			.select()
			.from(conversationSchema)
			.where(
				and(
					eq(conversationSchema.pid, pid),
					eq(conversationSchema.userId, userId),
				),
			)
			.limit(1);
	}

	export function updateLastMessageAt(
		pid: string,
		userId: string,
		date: Date = new Date(),
	) {
		return db
			.update(conversationSchema)
			.set({ lastMessageAt: date })
			.where(
				and(
					eq(conversationSchema.pid, pid),
					eq(conversationSchema.userId, userId),
				),
			)
			.returning();
	}

	export function createConversation(data: ConversationInsertModel) {
		return db.insert(conversationSchema).values(data).returning();
	}

	export function getConversationByPidWithDetails(pid: string, userId: string) {
		const latestMessages = db.$with("latest_messages").as(
			db.select({
				...getTableColumns(messageSchema),
				rn: sql<number>`row_number() OVER (PARTITION BY ${messageSchema.conversationId} ORDER BY ${messageSchema.createdAt} DESC, ${messageSchema.id} DESC)`.as('rn')
			})
			.from(messageSchema)
		);

		return db
			.with(latestMessages)
			.select({
				conversation: {
					pid: conversationSchema.pid,
					status: conversationSchema.status,
					lastMessageAt: conversationSchema.lastMessageAt,
					createdAt: conversationSchema.createdAt,
					updatedAt: conversationSchema.updatedAt,
				},
				user: {
					id: users.id,
					name: users.name,
					email: users.email,
					image: users.image,
				},
				contact: {
					pid: contactSchema.pid,
					name: contactSchema.name,
					email: contactSchema.email,
					phone: contactSchema.phone,
					data: contactSchema.data,
					provider: contactSchema.provider,
					providerId: contactSchema.providerId,
				},
				lastMessage: {
					id: latestMessages.id,
					pid: latestMessages.pid,
					conversationId: latestMessages.conversationId,
					senderType: latestMessages.senderType,
					content: latestMessages.content,
					contentType: latestMessages.contentType,
					normalizedText: latestMessages.normalizedText,
					embedding: latestMessages.embedding,
					createdAt: latestMessages.createdAt,
					updatedAt: latestMessages.updatedAt,
				},
			})
			.from(conversationSchema)
			.innerJoin(users, eq(conversationSchema.userId, users.id))
			.innerJoin(
				contactSchema,
				eq(conversationSchema.contactId, contactSchema.id),
			)
			.leftJoin(
				latestMessages,
				and(
					eq(latestMessages.conversationId, conversationSchema.id),
					eq(latestMessages.rn, 1)
				)
			)
			.where(
				and(
					eq(conversationSchema.pid, pid),
					eq(conversationSchema.userId, userId),
				),
			)
			.limit(1);
	}

	export function updateConversation(
		pid: string,
		userId: string,
		data: Partial<Pick<ConversationInsertModel, "status">>,
	) {
		return db
			.update(conversationSchema)
			.set(data)
			.where(
				and(
					eq(conversationSchema.pid, pid),
					eq(conversationSchema.userId, userId),
				),
			)
			.returning();
	}

	export function deleteConversation(pid: string, userId: string) {
		return db
			.delete(conversationSchema)
			.where(
				and(
					eq(conversationSchema.pid, pid),
					eq(conversationSchema.userId, userId),
				),
			)
			.returning();
	}

	export function getOpenConversationByContactId(contactId: number) {
		return db
			.select()
			.from(conversationSchema)
			.where(
				and(
					eq(conversationSchema.contactId, contactId),
					eq(conversationSchema.status, ConversationStatus.NEW),
				),
			)
			.limit(1);
	}
}
