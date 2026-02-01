import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import { users } from "../../auth/repo/auth.schema";
import { contactSchema } from "../../contact/repo/contact.schema";
import {
	type ConversationInsertModel,
	type ConversationStatus,
	conversationSchema,
} from "./conversation.schema";

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

		const query = db
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
			})
			.from(conversationSchema)
			.innerJoin(users, eq(conversationSchema.userId, users.id))
			.innerJoin(
				contactSchema,
				eq(conversationSchema.contactId, contactSchema.id),
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
		return db
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
			})
			.from(conversationSchema)
			.innerJoin(users, eq(conversationSchema.userId, users.id))
			.innerJoin(
				contactSchema,
				eq(conversationSchema.contactId, contactSchema.id),
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
}
