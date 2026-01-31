import { type Tracer, trace } from "@opentelemetry/api";
import { getTableName, is, Table } from "drizzle-orm";
import type { Logger } from "pino";
import type { Cache } from "../contracts/cache";
import { safeJsonStringifyWithAnyPrimitive } from "../utils/safeJsonStringify";

export type CacheConfig = {
	ex?: number;
	px?: number;
	exat?: number;
	pxat?: number;
	keepTtl?: boolean;
	hexOptions?: "NX" | "XX" | "GT" | "LT" | "nx" | "xx" | "gt" | "lt";
};

export class DrizzleCache {
	private readonly tracer: Tracer;
	private globalTtl: number = 60;
	private usedTablesPerKey: Record<string, string[]> = {};

	constructor(
		private readonly cache: Cache,
		private readonly logger: Logger,
	) {
		this.tracer = trace.getTracer("drizzle-cache");
	}

	strategy(): "explicit" | "all" {
		return "all";
	}

	async get(key: string): Promise<any[] | undefined> {
		return this.tracer.startActiveSpan(
			"drizzle.cache.get",
			{
				attributes: {
					key,
				},
			},
			async (span) => {
				this.logger.debug({ msg: "Getting key from cache", key });
				const res = await this.cache.get(key);
				span.setAttribute("hit", !!res);
				span.end();
				return res ? JSON.parse(res) : undefined;
			},
		);
	}

	async put(
		key: string,
		response: any,
		tables: string[],
		isTag: boolean,
		config?: CacheConfig,
	): Promise<void> {
		await this.tracer.startActiveSpan(
			"drizzle.cache.put",
			{
				attributes: {
					key,
					isTag,
					tables: safeJsonStringifyWithAnyPrimitive(tables) ?? "null",
					config: safeJsonStringifyWithAnyPrimitive(config) ?? "null",
				},
			},
			async (span) => {
				const ttl =
					config?.ex ??
					(config?.px ? Math.ceil(config.px / 1000) : this.globalTtl);

				this.logger.debug({ msg: "Putting key to cache", key, tables, ttl });
				await this.cache.set(key, JSON.stringify(response), ttl);

				for (const table of tables) {
					const keys = this.usedTablesPerKey[table];
					if (keys === undefined) {
						this.usedTablesPerKey[table] = [key];
					} else {
						keys.push(key);
					}
				}
				span.end();
			},
		);
	}

	async onMutate(params: {
		tags: string | string[];
		tables: string | string[] | Table<any> | Table<any>[];
	}): Promise<void> {
		await this.tracer.startActiveSpan(
			"drizzle.cache.onMutate",
			{
				attributes: {
					tags: safeJsonStringifyWithAnyPrimitive(params.tags) ?? "null",
				},
			},
			async (span) => {
				const tagsArray = params.tags
					? Array.isArray(params.tags)
						? params.tags
						: [params.tags]
					: [];
				const tablesArray = params.tables
					? Array.isArray(params.tables)
						? params.tables
						: [params.tables]
					: [];

				this.logger.debug({
					msg: "Invalidating cache",
					tags: tagsArray,
					tablesCount: tablesArray.length,
				});

				const keysToDelete = new Set<string>();

				for (const table of tablesArray) {
					const tableName = is(table, Table)
						? getTableName(table)
						: (table as string);
					const keys = this.usedTablesPerKey[tableName] ?? [];
					for (const key of keys) keysToDelete.add(key);
				}

				span.setAttribute("keysToDelete", keysToDelete.size);

				if (keysToDelete.size > 0 || tagsArray.length > 0) {
					for (const tag of tagsArray) {
						await this.cache.delete(tag);
					}

					for (const key of keysToDelete) {
						await this.cache.delete(key);
					}

					for (const table of tablesArray) {
						const tableName = is(table, Table)
							? getTableName(table)
							: (table as string);
						this.usedTablesPerKey[tableName] = [];
					}
				}
				span.end();
			},
		);
	}
}
