import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { ContactChannel } from "../../../../contact/repo/contact.schema";
import { logger } from "../../../../../start/logger";

const SMS_MAX_LENGTH = 160;
const SMS_CONCAT_MAX_LENGTH = 1600;

function formatForSMS(response: string): string[] {
	const trimmed = response.trim();

	if (trimmed.length <= SMS_MAX_LENGTH) {
		return [trimmed];
	}

	if (trimmed.length <= SMS_CONCAT_MAX_LENGTH) {
		return [trimmed];
	}

	const chunks: string[] = [];
	let remaining = trimmed.slice(0, SMS_CONCAT_MAX_LENGTH);

	while (remaining.length > 0) {
		if (remaining.length <= SMS_MAX_LENGTH) {
			chunks.push(remaining);
			break;
		}

		let breakPoint = remaining.lastIndexOf(". ", SMS_MAX_LENGTH);
		if (breakPoint === -1 || breakPoint < SMS_MAX_LENGTH * 0.5) {
			breakPoint = remaining.lastIndexOf(" ", SMS_MAX_LENGTH);
		}
		if (breakPoint === -1) {
			breakPoint = SMS_MAX_LENGTH;
		}

		chunks.push(remaining.slice(0, breakPoint + 1).trim());
		remaining = remaining.slice(breakPoint + 1).trim();
	}

	return chunks;
}

function formatForEmail(response: string, dealershipName: string): string {
	return `${response}

Best regards,
${dealershipName} Team`;
}

function formatForVoice(response: string): string {
	let formatted = response
		.replace(/&/g, "and")
		.replace(/\$/g, "dollars ")
		.replace(/%/g, " percent")
		.replace(/\b(\d+)\b/g, "$1 ");

	formatted = formatted.replace(/([.!?])\s*/g, "$1 <break time='300ms'/> ");

	return formatted;
}

export const formatForChannelStep = createStep({
	id: "format-for-channel",
	description: "Format response for specific communication channel",
	inputSchema: z.object({
		response: z.string(),
		channel: z.nativeEnum(ContactChannel),
		dealershipName: z.string().default("Our Dealership"),
	}),
	outputSchema: z.object({
		formattedResponse: z.string(),
		messageChunks: z.array(z.string()),
		channel: z.nativeEnum(ContactChannel),
	}),
	execute: async ({ inputData }) => {
		logger.info({ inputResponse: inputData.response?.slice(0, 100), channel: inputData.channel }, "Formatting response for channel");
		switch (inputData.channel) {
			case ContactChannel.SMS: {
				const chunks = formatForSMS(inputData.response);
				return {
					formattedResponse: chunks.join("\n\n"),
					messageChunks: chunks,
					channel: inputData.channel,
				};
			}
			case ContactChannel.EMAIL: {
				const formatted = formatForEmail(inputData.response, inputData.dealershipName);
				return {
					formattedResponse: formatted,
					messageChunks: [formatted],
					channel: inputData.channel,
				};
			}
			case ContactChannel.VOICE: {
				const formatted = formatForVoice(inputData.response);
				return {
					formattedResponse: formatted,
					messageChunks: [formatted],
					channel: inputData.channel,
				};
			}
			default: {
				return {
					formattedResponse: inputData.response,
					messageChunks: [inputData.response],
					channel: inputData.channel,
				};
			}
		}
	},
});
