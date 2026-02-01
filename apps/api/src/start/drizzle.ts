import { instrumentDrizzle } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DrizzleCache } from "../infra/drizzleCache";
import { env } from "../utils/env";
import { cache } from "./cache";
import { logger } from "./logger";
import * as schema from "./schema";

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

const drizzleCache = new DrizzleCache(cache, logger);

export const db = drizzle(instrumentDrizzle(pool), {
	schema,
	cache: drizzleCache,
});

export async function pingDatabase() {
	try {
		await db.execute("SELECT 1");
	} catch (error) {
		console.error("Database ping failed:", error);
		throw error;
	}
}
