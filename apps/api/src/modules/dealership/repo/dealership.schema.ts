import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import z from "zod";
import { baseColumns } from "../../shared/repo/baseColumns";

export const businessHoursSchema = z.object({
	monday: z.object({ open: z.string(), close: z.string() }).optional(),
	tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
	wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
	thursday: z.object({ open: z.string(), close: z.string() }).optional(),
	friday: z.object({ open: z.string(), close: z.string() }).optional(),
	saturday: z.object({ open: z.string(), close: z.string() }).optional(),
	sunday: z.object({ open: z.string(), close: z.string() }).optional(),
});

export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const dealershipConfigSchema = z.object({
	tone: z.enum(["professional", "friendly", "casual", "luxury"]).default("professional"),
	persona: z.string().optional(),
	qualifyingQuestions: z.array(z.string()).default([]),
	afterHoursMessage: z.string().optional(),
	escalationEmail: z.string().email().optional(),
	welcomeMessage: z.string().optional(),
});

export type DealershipConfig = z.infer<typeof dealershipConfigSchema>;

export enum CrmType {
	VINSOLUTIONS = "VINSOLUTIONS",
	DEALERSOCKET = "DEALERSOCKET",
	ELEAD = "ELEAD",
	SALESFORCE = "SALESFORCE",
}

export const dealershipSchema = pgTable("dealerships", {
	...baseColumns(),
	name: varchar("name", { length: 255 }).notNull(),
	brand: varchar("brand", { length: 100 }),
	timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
	phone: varchar("phone", { length: 20 }),
	businessHours: jsonb("business_hours").$type<BusinessHours>(),
	config: jsonb("config").$type<DealershipConfig>().default({
		tone: "professional",
		qualifyingQuestions: [],
	}),
	crmType: varchar("crm_type", { length: 50 }).$type<CrmType>(),
	crmApiKey: text("crm_api_key"),
	inventoryApiUrl: text("inventory_api_url"),
});

export type DealershipSelectModel = InferSelectModel<typeof dealershipSchema>;
export type DealershipInsertModel = InferInsertModel<typeof dealershipSchema>;
