import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import {
	type ContactInsertModel,
	type ContactProvider,
	contactSchema,
} from "./contact.schema";

export namespace ContactRepo {
	export function updateContact(
		contactPid: string,
		data: Partial<ContactInsertModel>,
	) {
		return db
			.update(contactSchema)
			.set(data)
			.where(eq(contactSchema.pid, contactPid))
			.returning();
	}

	export function createContact(data: ContactInsertModel) {
		return db.insert(contactSchema).values(data).returning();
	}

	export function getContactByPidAndUserId(contactPid: string, userId: string) {
		return db
			.select()
			.from(contactSchema)
			.where(
				and(
					eq(contactSchema.pid, contactPid),
					eq(contactSchema.userId, userId),
				),
			)
			.limit(1);
	}

	export function getContactsByUserId(userId: string) {
		return db
			.select()
			.from(contactSchema)
			.where(eq(contactSchema.userId, userId));
	}

	export function getContactIdentifiersByUserId(
		userId: string,
		provider: ContactProvider,
	) {
		return db
			.select({
				pid: contactSchema.pid,
				provider: contactSchema.provider,
				providerId: contactSchema.providerId,
			})
			.from(contactSchema)
			.where(
				and(
					eq(contactSchema.userId, userId),
					eq(contactSchema.provider, provider),
				),
			);
	}

	export function getContacts(filters: {
		userId: string;
		search?: string;
		provider?: ContactProvider;
		limit?: number;
		offset?: number;
		sort?: "asc" | "desc";
	}) {
		const conditions = [eq(contactSchema.userId, filters.userId)];

		if (filters.provider) {
			conditions.push(eq(contactSchema.provider, filters.provider));
		}

		if (filters.search) {
			conditions.push(
				or(
					ilike(contactSchema.name, `%${filters.search}%`),
					ilike(contactSchema.email, `%${filters.search}%`),
					ilike(contactSchema.phone, `%${filters.search}%`),
				)!,
			);
		}

		const orderBy =
			filters.sort === "asc" ? asc(contactSchema.id) : desc(contactSchema.id);

		const query = db
			.select({
				pid: contactSchema.pid,
				name: contactSchema.name,
				email: contactSchema.email,
				phone: contactSchema.phone,
				data: contactSchema.data,
				provider: contactSchema.provider,
				createdAt: contactSchema.createdAt,
				updatedAt: contactSchema.updatedAt,
			})
			.from(contactSchema)
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

	export async function countContacts(filters: {
		userId: string;
		search?: string;
		provider?: ContactProvider;
	}) {
		const conditions = [eq(contactSchema.userId, filters.userId)];

		if (filters.provider) {
			conditions.push(eq(contactSchema.provider, filters.provider));
		}

		if (filters.search) {
			conditions.push(
				or(
					ilike(contactSchema.name, `%${filters.search}%`),
					ilike(contactSchema.email, `%${filters.search}%`),
					ilike(contactSchema.phone, `%${filters.search}%`),
				)!,
			);
		}

		const [result] = await db
			.select({ value: count() })
			.from(contactSchema)
			.where(and(...conditions));

		if (!result) {
			throw new Error("Failed to count contacts");
		}

		return result.value;
	}

	export function deleteContact(contactPid: string, userId: string) {
		return db
			.delete(contactSchema)
			.where(
				and(
					eq(contactSchema.pid, contactPid),
					eq(contactSchema.userId, userId),
				),
			)
			.returning();
	}

	export function updateContactByPidAndUserId(
		contactPid: string,
		userId: string,
		data: Partial<
			Pick<ContactInsertModel, "name" | "email" | "phone" | "data">
		>,
	) {
		return db
			.update(contactSchema)
			.set(data)
			.where(
				and(
					eq(contactSchema.pid, contactPid),
					eq(contactSchema.userId, userId),
				),
			)
			.returning();
	}

	export function getContactByPhoneAndDealership(
		phone: string,
		dealershipId: number,
	) {
		return db
			.select()
			.from(contactSchema)
			.where(
				and(
					eq(contactSchema.phone, phone),
					eq(contactSchema.dealershipId, dealershipId),
				),
			)
			.limit(1);
	}

	export function updateContactById(
		id: number,
		data: Partial<ContactInsertModel>,
	) {
		return db
			.update(contactSchema)
			.set(data)
			.where(eq(contactSchema.id, id))
			.returning();
	}
}
