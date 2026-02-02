import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "../../auth/repo/auth.schema";
import { contactSchema } from "../../contact/repo/contact.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum EscalationReason {
	ANGRY_CUSTOMER = "ANGRY_CUSTOMER",
	PRICE_REQUEST = "PRICE_REQUEST",
	COMPLEX_TRADE = "COMPLEX_TRADE",
	AI_UNCERTAINTY = "AI_UNCERTAINTY",
	EXPLICIT_REQUEST = "EXPLICIT_REQUEST",
	COMPLIANCE = "COMPLIANCE",
}

export const escalationSchema = pgTable("escalations", {
	...baseColumns(),
	contactId: integer("contact_id")
		.references(() => contactSchema.id, { onDelete: "cascade" })
		.notNull(),
	reason: varchar("reason", { length: 50 }).notNull().$type<EscalationReason>(),
	aiConfidence: real("ai_confidence"),
	handedOffAt: timestamp("handed_off_at"),
	resolvedAt: timestamp("resolved_at"),
	humanAgentId: text("human_agent_id").references(() => users.id),
	notes: text("notes"),
});

export type EscalationSelectModel = InferSelectModel<typeof escalationSchema>;
export type EscalationInsertModel = InferInsertModel<typeof escalationSchema>;
