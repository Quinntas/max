import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { createMaxAgent, defaultMaxAgent } from "../../max/max.agent";
import { maxResponsePrompt } from "../../max/max.prompts";
import type { DealershipSelectModel } from "../../../../dealership/repo/dealership.schema";
import { logger } from "../../../../../start/logger";

export const generateResponseStep = createStep({
	id: "generate-response",
	description: "Generate AI response using Max agent",
	inputSchema: z.object({
		messageContent: z.string(),
		conversationContext: z.string(),
		dealership: z
			.object({
				id: z.number(),
				pid: z.string(),
				name: z.string(),
				brand: z.string().nullable(),
				config: z.record(z.string(), z.unknown()).nullable(),
			})
			.nullable(),
		shouldEscalate: z.boolean(),
		escalationReason: z.string().nullable(),
		inventoryContext: z.string().optional(),
	}),
	outputSchema: z.object({
		response: z.string(),
		isEscalationResponse: z.boolean(),
  }),
	execute: async ({ inputData }): Promise<{ response: string; isEscalationResponse: boolean }> => {
		if (inputData.shouldEscalate) {
			const escalationResponses: Record<string, string> = {
				ANGRY_CUSTOMER:
					"I sincerely apologize for any frustration. Let me connect you with a manager right away who can address this directly. Someone will reach out within the next few minutes.",
				EXPLICIT_REQUEST:
					"Absolutely! I'm connecting you with one of our team members who can better assist you. They'll reach out shortly.",
				PRICE_REQUEST:
					"Great question! For the best pricing details, let me connect you with our sales manager who can put together the right numbers for your situation. What's the best number to reach you?",
				AI_UNCERTAINTY:
					"I want to make sure you get accurate information. Let me have one of our specialists reach out to you directly. What's the best way to contact you?",
				COMPLEX_TRADE:
					"Trade-in values depend on several factors. I'd love to get you an accurate appraisal. Would you prefer to stop by for a quick evaluation, or should I have our team call you?",
				COMPLIANCE: "Thank you for reaching out. A member of our team will contact you shortly.",
			};

			const response =
				escalationResponses[inputData.escalationReason || "AI_UNCERTAINTY"] ||
				escalationResponses.AI_UNCERTAINTY ||
				"";

			return {
				response,
				isEscalationResponse: true,
			};
		}

		const dealershipName = inputData.dealership?.name || "Our Dealership";

		let conversationContext = inputData.conversationContext;
		if (inputData.inventoryContext) {
			conversationContext += `\n\nINVENTORY INFORMATION:\n${inputData.inventoryContext}`;
		}

		const prompt = maxResponsePrompt({
			formattedConversation: conversationContext,
			dealershipName,
		});

		const agent = inputData.dealership ? createMaxAgent(inputData.dealership as DealershipSelectModel) : defaultMaxAgent;

		logger.info({ prompt: prompt.slice(0, 200) }, "Generating AI response");

		const result = await agent.generate([{ role: "user", content: prompt }]);

		logger.info({ responseLength: result.text?.length, response: result.text?.slice(0, 100) }, "AI response generated");

		return {
			response: result.text || "",
			isEscalationResponse: false,
		};
	},
});
