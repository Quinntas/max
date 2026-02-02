import { createStep } from "@mastra/core/workflows";
import z from "zod";
import type { ExtractedLeadInfo } from "./extractContactInfo";

const scoreBreakdownSchema = z.object({
	intent: z.number(),
	timeline: z.number(),
	budget: z.number(),
	vehicle: z.number(),
	tradeIn: z.number(),
});

export const qualificationScoreSchema = z.object({
	score: z.number(),
	breakdown: scoreBreakdownSchema,
	recommendation: z.enum(["QUALIFIED", "NURTURE", "ESCALATE"]),
});

export type QualificationScore = z.infer<typeof qualificationScoreSchema>;

function calculateScore(leadInfo: ExtractedLeadInfo): QualificationScore {
	const breakdown = {
		intent: 0,
		timeline: 0,
		budget: 0,
		vehicle: 0,
		tradeIn: 0,
	};

	switch (leadInfo.intent) {
		case "SALES":
			breakdown.intent = 30;
			break;
		case "TRADE_IN":
			breakdown.intent = 25;
			break;
		case "SERVICE":
			breakdown.intent = 15;
			break;
		default:
			breakdown.intent = 0;
	}

	switch (leadInfo.timeline) {
		case "immediate":
			breakdown.timeline = 25;
			break;
		case "this_week":
			breakdown.timeline = 20;
			break;
		case "this_month":
			breakdown.timeline = 10;
			break;
		default:
			breakdown.timeline = 0;
	}

	if (leadInfo.budgetMentioned) {
		if (leadInfo.budgetRange?.min || leadInfo.budgetRange?.max) {
			breakdown.budget = 20;
		} else {
			breakdown.budget = 10;
		}
	}

	const vi = leadInfo.vehicleInterest;
	if (vi.make && vi.model && vi.year) {
		breakdown.vehicle = 15;
	} else if (vi.make && vi.model) {
		breakdown.vehicle = 10;
	} else if (vi.make) {
		breakdown.vehicle = 5;
	}

	if (leadInfo.hasTradeIn) {
		breakdown.tradeIn = 10;
	}

	const score = breakdown.intent + breakdown.timeline + breakdown.budget + breakdown.vehicle + breakdown.tradeIn;

	let recommendation: "QUALIFIED" | "NURTURE" | "ESCALATE";
	if (leadInfo.wantsHuman || leadInfo.sentimentScore < -0.5) {
		recommendation = "ESCALATE";
	} else if (score >= 50) {
		recommendation = "QUALIFIED";
	} else {
		recommendation = "NURTURE";
	}

	return { score, breakdown, recommendation };
}

export const scoreQualificationStep = createStep({
	id: "score-qualification",
	description: "Calculate lead qualification score based on extracted information",
	inputSchema: z.object({
		intent: z.enum(["SALES", "SERVICE", "TRADE_IN", "UNKNOWN"]),
		vehicleInterest: z.object({
			make: z.string().nullable(),
			model: z.string().nullable(),
			year: z.number().nullable(),
			trim: z.string().nullable(),
		}),
		timeline: z.enum(["immediate", "this_week", "this_month", "just_browsing"]).nullable(),
		budgetMentioned: z.boolean(),
		budgetRange: z
			.object({
				min: z.number().nullable(),
				max: z.number().nullable(),
			})
			.nullable(),
		hasTradeIn: z.boolean(),
		tradeInVehicle: z.string().nullable(),
		wantsHuman: z.boolean(),
		sentimentScore: z.number(),
		confidence: z.number(),
	}),
	outputSchema: qualificationScoreSchema,
	execute: async ({ inputData }) => {
		return calculateScore(inputData);
	},
});
