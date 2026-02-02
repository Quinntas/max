import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { checkEscalationTriggers } from "../../max/guardrails";
import { EscalationReason } from "../../../../escalation/repo/escalation.schema";

export const escalationCheckSchema = z.object({
	shouldEscalate: z.boolean(),
	reason: z.nativeEnum(EscalationReason).nullable(),
	aiConfidence: z.number(),
});

export type EscalationCheckResult = z.infer<typeof escalationCheckSchema>;

export const checkEscalationStep = createStep({
	id: "check-escalation",
	description: "Determine if conversation should be escalated to human agent",
	inputSchema: z.object({
		messageContent: z.string(),
		sentimentScore: z.number(),
		wantsHuman: z.boolean(),
		confidence: z.number(),
		recommendation: z.enum(["QUALIFIED", "NURTURE", "ESCALATE"]),
	}),
	outputSchema: escalationCheckSchema,
	execute: async ({ inputData }) => {
		if (inputData.recommendation === "ESCALATE") {
			let reason = EscalationReason.AI_UNCERTAINTY;

			if (inputData.wantsHuman) {
				reason = EscalationReason.EXPLICIT_REQUEST;
			} else if (inputData.sentimentScore < -0.5) {
				reason = EscalationReason.ANGRY_CUSTOMER;
			}

			return {
				shouldEscalate: true,
				reason,
				aiConfidence: inputData.confidence,
			};
		}

		const triggerCheck = checkEscalationTriggers(inputData.messageContent, inputData.confidence);

		if (triggerCheck.shouldEscalate) {
			const reasonMap: Record<string, EscalationReason> = {
				ANGRY_CUSTOMER: EscalationReason.ANGRY_CUSTOMER,
				EXPLICIT_REQUEST: EscalationReason.EXPLICIT_REQUEST,
				PRICE_REQUEST: EscalationReason.PRICE_REQUEST,
				AI_UNCERTAINTY: EscalationReason.AI_UNCERTAINTY,
			};

			return {
				shouldEscalate: true,
				reason: reasonMap[triggerCheck.reason || "AI_UNCERTAINTY"] || EscalationReason.AI_UNCERTAINTY,
				aiConfidence: inputData.confidence,
			};
		}

		return {
			shouldEscalate: false,
			reason: null,
			aiConfidence: inputData.confidence,
		};
	},
});
