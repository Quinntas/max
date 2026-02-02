import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import { type DealershipInsertModel, dealershipSchema } from "./dealership.schema";

export namespace DealershipRepo {
	export function createDealership(data: DealershipInsertModel) {
		return db.insert(dealershipSchema).values(data).returning();
	}

	export function getDealershipByPid(pid: string) {
		return db.select().from(dealershipSchema).where(eq(dealershipSchema.pid, pid)).limit(1);
	}

	export function getDealershipById(id: number) {
		return db.select().from(dealershipSchema).where(eq(dealershipSchema.id, id)).limit(1);
	}

	export function getDealershipByPhone(phone: string) {
		return db.select().from(dealershipSchema).where(eq(dealershipSchema.phone, phone)).limit(1);
	}

	export function getDealerships(filters: {
		search?: string;
		brand?: string;
		limit?: number;
		offset?: number;
		sort?: "asc" | "desc";
	}) {
		const conditions = [];

		if (filters.brand) {
			conditions.push(eq(dealershipSchema.brand, filters.brand));
		}

		if (filters.search) {
			conditions.push(ilike(dealershipSchema.name, `%${filters.search}%`));
		}

		const orderBy = filters.sort === "asc" ? asc(dealershipSchema.id) : desc(dealershipSchema.id);

		const query = db
			.select()
			.from(dealershipSchema)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(orderBy);

		if (filters.limit !== undefined) {
			query.limit(filters.limit);
		}

		if (filters.offset !== undefined) {
			query.offset(filters.offset);
		}

		return query;
	}

	export async function countDealerships(filters: { search?: string; brand?: string }) {
		const conditions = [];

		if (filters.brand) {
			conditions.push(eq(dealershipSchema.brand, filters.brand));
		}

		if (filters.search) {
			conditions.push(ilike(dealershipSchema.name, `%${filters.search}%`));
		}

		const [result] = await db
			.select({ value: count() })
			.from(dealershipSchema)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		if (!result) {
			throw new Error("Failed to count dealerships");
		}

		return result.value;
	}

	export function updateDealership(pid: string, data: Partial<DealershipInsertModel>) {
		return db.update(dealershipSchema).set(data).where(eq(dealershipSchema.pid, pid)).returning();
	}

	export function deleteDealership(pid: string) {
		return db.delete(dealershipSchema).where(eq(dealershipSchema.pid, pid)).returning();
	}
}
