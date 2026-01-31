import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/pg-core";

export function baseColumns() {
	return {
		id: serial().primaryKey(),
		pid: varchar({ length: 255 })
			.notNull()
			.unique()
			.$defaultFn(() => randomUUID()),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.default(sql.raw("now()")),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	};
}
