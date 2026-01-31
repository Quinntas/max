import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import z from "zod";
import { users } from "../../auth/repo/auth.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum ContactProvider {
	HUBSPOT = "HUBSPOT",
}

export const contactData = z.object({
	notes: z.string().optional(),
});

export const contactSchema = pgTable("contacts", {
	...baseColumns(),
	userId: text("user_id")
		.references(() => users.id)
		.notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 255 }).notNull(),
	data: jsonb("data")
		.notNull()
		.$type<z.infer<typeof contactData>>()
		.default({}),
	provider: varchar("provider", {
		length: 255,
	})
		.notNull()
		.$type<ContactProvider>(),
	providerId: text(),
});

export type ContactSelectModel = InferSelectModel<typeof contactSchema>;
export type ContactInsertModel = InferInsertModel<typeof contactSchema>;
