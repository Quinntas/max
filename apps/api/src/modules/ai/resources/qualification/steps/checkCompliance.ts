import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { detectStopMessage } from "../../max/guardrails";

export const checkComplianceStep = createStep({
	id: "check-compliance",
	description: "Check for STOP messages and consent compliance",
	inputSchema: z.object({
		messageContent: z.string(),
		contactId: z.number().optional(),
		hasConsent: z.boolean().default(true),
	}),
	outputSchema: z.object({
		isCompliant: z.boolean(),
		action: z.enum(["CONTINUE", "OPT_OUT", "NO_CONSENT"]),
		stopMessageDetected: z.boolean(),
	}),
	execute: async ({ inputData }) => {
		const stopDetected = detectStopMessage(inputData.messageContent);

		if (stopDetected) {
			return {
				isCompliant: false,
				action: "OPT_OUT" as const,
				stopMessageDetected: true,
			};
		}

		if (!inputData.hasConsent) {
			return {
				isCompliant: false,
				action: "NO_CONSENT" as const,
				stopMessageDetected: false,
			};
		}

		return {
			isCompliant: true,
			action: "CONTINUE" as const,
			stopMessageDetected: false,
		};
	},
});
