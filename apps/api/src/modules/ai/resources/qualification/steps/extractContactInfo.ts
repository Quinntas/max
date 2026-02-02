import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { defaultMaxAgent } from "../../max/max.agent";
import { extractLeadInfoPrompt } from "../../max/max.prompts";

const vehicleInterestSchema = z.object({
	make: z.string().nullable(),
	model: z.string().nullable(),
	year: z.number().nullable(),
	trim: z.string().nullable(),
});

const budgetRangeSchema = z.object({
	min: z.number().nullable(),
	max: z.number().nullable(),
});

export const extractedLeadInfoSchema = z.object({
	intent: z.enum(["SALES", "SERVICE", "TRADE_IN", "UNKNOWN"]),
	vehicleInterest: vehicleInterestSchema,
	timeline: z.enum(["immediate", "this_week", "this_month", "just_browsing"]).nullable(),
	budgetMentioned: z.boolean(),
	budgetRange: budgetRangeSchema.nullable(),
	hasTradeIn: z.boolean(),
	tradeInVehicle: z.string().nullable(),
	wantsHuman: z.boolean(),
	sentimentScore: z.number(),
	confidence: z.number(),
});

export type ExtractedLeadInfo = z.infer<typeof extractedLeadInfoSchema>;

export const extractContactInfoStep = createStep({
	id: "extract-contact-info",
	description: "Extract lead qualification information from message using AI",
	inputSchema: z.object({
		messageContent: z.string(),
		conversationContext: z.string().default(""),
	}),
	outputSchema: extractedLeadInfoSchema,
	execute: async ({ inputData }) => {
		const prompt = extractLeadInfoPrompt({
			messageContent: inputData.messageContent,
			conversationContext: inputData.conversationContext,
		});

    const response = await defaultMaxAgent.generate([{ role: "user", content: prompt }], {
        structuredOutput: {
          schema:  extractedLeadInfoSchema,
        },
		});

		if (response.object) {
			return response.object;
		}

		return {
			intent: "UNKNOWN" as const,
			vehicleInterest: { make: null, model: null, year: null, trim: null },
			timeline: null,
			budgetMentioned: false,
			budgetRange: null,
			hasTradeIn: false,
			tradeInVehicle: null,
			wantsHuman: false,
			sentimentScore: 0,
			confidence: 0.5,
		};
	},
});
