import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { validateResponse, sanitizeResponse } from "../../max/guardrails";

export const validateResponseStep = createStep({
	id: "validate-response",
	description: "Validate AI response against hallucination patterns",
	inputSchema: z.object({
		response: z.string(),
		isEscalationResponse: z.boolean(),
	}),
	outputSchema: z.object({
		response: z.string(),
		isValid: z.boolean(),
		violations: z.array(z.string()),
		wasSanitized: z.boolean(),
	}),
	execute: async ({ inputData }) => {
		if (inputData.isEscalationResponse) {
			return {
				response: inputData.response,
				isValid: true,
				violations: [],
				wasSanitized: false,
			};
		}

		const validation = validateResponse(inputData.response);

		if (validation.valid) {
			return {
				response: inputData.response,
				isValid: true,
				violations: [],
				wasSanitized: false,
			};
		}

		const sanitized = sanitizeResponse(inputData.response);

		return {
			response: sanitized,
			isValid: false,
			violations: validation.violations,
			wasSanitized: true,
		};
	},
});
