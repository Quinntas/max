import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import z from "zod";
import { users } from "../../auth/repo/auth.schema";
import { dealershipSchema } from "../../dealership/repo/dealership.schema";
import { baseColumns } from "../../shared/repo/baseColumns";

export enum ContactProvider {
	HUBSPOT = "HUBSPOT",
	SMS = "SMS",
	EMAIL = "EMAIL",
	VOICE = "VOICE",
}

export enum ContactStatus {
	NEW = "NEW",
	QUALIFIED = "QUALIFIED",
	NURTURE = "NURTURE",
	ESCALATED = "ESCALATED",
	CONVERTED = "CONVERTED",
	LOST = "LOST",
}

export enum ContactIntent {
	SALES = "SALES",
	SERVICE = "SERVICE",
	TRADE_IN = "TRADE_IN",
	UNKNOWN = "UNKNOWN",
}

export enum ContactChannel {
	SMS = "SMS",
	EMAIL = "EMAIL",
	VOICE = "VOICE",
}

export const contactData = z.object({
	notes: z.string().optional(),
});

export const budgetSchema = z.object({
	min: z.number().optional(),
	max: z.number().optional(),
	hasFinancing: z.boolean().optional(),
});

export type Budget = z.infer<typeof budgetSchema>;

export const tradeInSchema = z.object({
	hasTradeIn: z.boolean(),
	vehicle: z.string().optional(),
	year: z.number().optional(),
	make: z.string().optional(),
	model: z.string().optional(),
	mileage: z.number().optional(),
});

export type TradeIn = z.infer<typeof tradeInSchema>;

export const vehicleInterestSchema = z.object({
	make: z.string().optional(),
	model: z.string().optional(),
	year: z.number().optional(),
	trim: z.string().optional(),
	vin: z.string().optional(),
});

export type VehicleInterest = z.infer<typeof vehicleInterestSchema>;

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

	dealershipId: integer("dealership_id").references(() => dealershipSchema.id),
	channel: varchar("channel", { length: 20 }).$type<ContactChannel>(),
	status: varchar("status", { length: 50 }).$type<ContactStatus>().default(ContactStatus.NEW),
	intent: varchar("intent", { length: 50 }).$type<ContactIntent>(),
	qualificationScore: integer("qualification_score"),
	timeline: varchar("timeline", { length: 50 }),
	budget: jsonb("budget").$type<Budget>(),
	tradeIn: jsonb("trade_in").$type<TradeIn>(),
	vehicleInterest: jsonb("vehicle_interest").$type<VehicleInterest>(),
	appointmentScheduled: timestamp("appointment_scheduled"),
	crmExternalId: varchar("crm_external_id", { length: 255 }),
	assignedTo: text("assigned_to").references(() => users.id),
});

export type ContactSelectModel = InferSelectModel<typeof contactSchema>;
export type ContactInsertModel = InferInsertModel<typeof contactSchema>;
