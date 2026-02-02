import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { contactSchema } from "../../contact/repo/contact.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum ConsentType {
	TCPA_SMS = "TCPA_SMS",
	TCPA_VOICE = "TCPA_VOICE",
	EMAIL_MARKETING = "EMAIL_MARKETING",
}

export enum ConsentChannel {
	SMS = "SMS",
	EMAIL = "EMAIL",
	VOICE = "VOICE",
}

export const consentSchema = pgTable("consents", {
	...baseColumns(),
	contactId: integer("contact_id")
		.references(() => contactSchema.id, { onDelete: "cascade" })
		.notNull(),
	channel: varchar("channel", { length: 20 }).notNull().$type<ConsentChannel>(),
	consentType: varchar("consent_type", { length: 50 }).notNull().$type<ConsentType>(),
	granted: boolean("granted").notNull(),
	grantedAt: timestamp("granted_at"),
	revokedAt: timestamp("revoked_at"),
	source: varchar("source", { length: 100 }),
});

export type ConsentSelectModel = InferSelectModel<typeof consentSchema>;
export type ConsentInsertModel = InferInsertModel<typeof consentSchema>;
