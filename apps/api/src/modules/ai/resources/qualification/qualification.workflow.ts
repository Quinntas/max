import { Workflow } from "@mastra/core/workflows";
import z from "zod";
import { ContactChannel, ContactIntent } from "../../../contact/repo/contact.schema";
import { EscalationReason } from "../../../escalation/repo/escalation.schema";
import { checkComplianceStep } from "./steps/checkCompliance";
import { extractContactInfoStep } from "./steps/extractContactInfo";
import { scoreQualificationStep } from "./steps/scoreQualification";
import { checkEscalationStep } from "./steps/checkEscalation";
import { generateResponseStep } from "./steps/generateResponse";
import { validateResponseStep } from "./steps/validateResponse";
import { formatForChannelStep } from "./steps/formatForChannel";
import { lookupInventoryStep } from "./steps/lookupInventory";

const dealershipInputSchema = z.object({
	id: z.number(),
	pid: z.string(),
	name: z.string(),
	brand: z.string().nullable(),
	config: z.record(z.string(), z.unknown()).nullable(),
});

export const qualificationWorkflowInputSchema = z.object({
	messageContent: z.string(),
	conversationContext: z.string().default(""),
	contactId: z.number().optional(),
	channel: z.nativeEnum(ContactChannel),
	dealership: dealershipInputSchema.nullable(),
	hasConsent: z.boolean().default(true),
});

export type QualificationWorkflowInput = z.infer<typeof qualificationWorkflowInputSchema>;

export const qualificationWorkflowOutputSchema = z.object({
	response: z.string(),
	messageChunks: z.array(z.string()),
	action: z.enum(["RESPOND", "ESCALATE", "OPT_OUT", "NO_CONSENT"]),
	qualification: z
		.object({
			intent: z.nativeEnum(ContactIntent),
			score: z.number(),
			recommendation: z.enum(["QUALIFIED", "NURTURE", "ESCALATE"]),
			timeline: z.string().nullable(),
			vehicleInterest: z
				.object({
					make: z.string().nullable(),
					model: z.string().nullable(),
					year: z.number().nullable(),
				})
				.nullable(),
			hasTradeIn: z.boolean(),
		})
		.nullable(),
	escalation: z
		.object({
			reason: z.nativeEnum(EscalationReason),
			aiConfidence: z.number(),
		})
		.nullable(),
});

export type QualificationWorkflowOutput = z.infer<typeof qualificationWorkflowOutputSchema>;

export const qualificationWorkflow = new Workflow({
	id: "qualification-workflow",
	description: "Multi-step workflow for qualifying automotive leads via SMS/Email/Voice",
	inputSchema: qualificationWorkflowInputSchema,
	outputSchema: qualificationWorkflowOutputSchema,
	retryConfig: {
		attempts: 3,
		delay: 1000,
	},
})
	.then(checkComplianceStep)
	.map(async ({ inputData, getInitData }) => {
		const initialInput = getInitData<QualificationWorkflowInput>();
		if (inputData.action !== "CONTINUE") {
			return {
				earlyExit: inputData.action as "OPT_OUT" | "NO_CONSENT",
				messageContent: initialInput.messageContent,
				conversationContext: initialInput.conversationContext,
			};
		}
		return {
			earlyExit: null,
			messageContent: initialInput.messageContent,
			conversationContext: initialInput.conversationContext,
		};
	})
	.then(extractContactInfoStep)
	.map(async ({ getStepResult, getInitData }) => {
		const extraction = getStepResult?.(extractContactInfoStep);
		return {
			vehicleInterest: extraction?.vehicleInterest ?? null,
		};
	})
	.then(lookupInventoryStep)
	.map(async ({ getStepResult }) => {
		const extraction = getStepResult?.(extractContactInfoStep);
		return extraction!;
	})
	.then(scoreQualificationStep)
	.map(async ({ inputData, getInitData, getStepResult }) => {
		const initialInput = getInitData<QualificationWorkflowInput>();
		const extraction = getStepResult?.(extractContactInfoStep);
		return {
			messageContent: initialInput.messageContent,
			sentimentScore: extraction?.sentimentScore ?? 0,
			wantsHuman: extraction?.wantsHuman ?? false,
			confidence: extraction?.confidence ?? 0.8,
			recommendation: inputData.recommendation,
		};
	})
	.then(checkEscalationStep)
	.map(async ({ inputData, getInitData, getStepResult }) => {
		const initial = getInitData<QualificationWorkflowInput>();
		const inventory = getStepResult?.(lookupInventoryStep);
		return {
			messageContent: initial.messageContent,
			conversationContext: initial.conversationContext,
			dealership: initial.dealership,
			shouldEscalate: inputData.shouldEscalate,
			escalationReason: inputData.reason,
			inventoryContext: inventory?.inventoryContext,
		};
	})
	.then(generateResponseStep)
	.then(validateResponseStep)
	.map(async ({ inputData, getInitData }) => {
		const initial = getInitData<QualificationWorkflowInput>();
		return {
			response: inputData.response,
			channel: initial.channel,
			dealershipName: initial.dealership?.name || "Our Dealership",
		};
	})
	.then(formatForChannelStep)
	.map(async ({ inputData, getStepResult, getInitData }) => {
		const compliance = getStepResult?.(checkComplianceStep);

		if (compliance?.action === "OPT_OUT") {
			return {
				response: "",
				messageChunks: [],
				action: "OPT_OUT" as const,
				qualification: null,
				escalation: null,
			};
		}

		if (compliance?.action === "NO_CONSENT") {
			return {
				response: "",
				messageChunks: [],
				action: "NO_CONSENT" as const,
				qualification: null,
				escalation: null,
			};
		}

		const extraction = getStepResult?.(extractContactInfoStep);
		const scoring = getStepResult?.(scoreQualificationStep);
		const escalationCheck = getStepResult?.(checkEscalationStep);

		const action = escalationCheck?.shouldEscalate ? "ESCALATE" : "RESPOND";

		return {
			response: inputData.formattedResponse,
			messageChunks: inputData.messageChunks,
			action: action as "RESPOND" | "ESCALATE",
			qualification: {
				intent: extraction?.intent ?? ("UNKNOWN" as ContactIntent),
				score: scoring?.score ?? 0,
				recommendation: scoring?.recommendation ?? ("NURTURE" as const),
				timeline: extraction?.timeline ?? null,
				vehicleInterest: extraction?.vehicleInterest ?? null,
				hasTradeIn: extraction?.hasTradeIn ?? false,
			},
			escalation: escalationCheck?.shouldEscalate
				? {
						reason: escalationCheck.reason!,
						aiConfidence: escalationCheck.aiConfidence,
					}
				: null,
		};
	})
	.commit();
