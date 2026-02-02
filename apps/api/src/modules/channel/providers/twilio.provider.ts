import crypto from "node:crypto";
import { ContactChannel } from "../../contact/repo/contact.schema";
import type {
	ChannelProvider,
	IncomingMessage,
	OutgoingMessage,
	SendResult,
	ChannelOptions,
	ChannelConfig,
} from "../core/channel.interface";
import { env } from "../../../utils/env";
import { logger } from "../../../start/logger";

interface TwilioWebhookPayload {
	MessageSid: string;
	AccountSid: string;
	From: string;
	To: string;
	Body: string;
	NumMedia?: string;
	MediaUrl0?: string;
}

interface TwilioApiResponse {
	sid?: string;
	message?: string;
	status?: string;
	code?: number;
}

const SMS_MAX_LENGTH = 1600;

export class TwilioProvider implements ChannelProvider {
	readonly channel = ContactChannel.SMS;
	private accountSid: string;
	private authToken: string;
	private fromNumber: string;
	private webhookUrl: string;

	constructor(config?: ChannelConfig) {
		this.accountSid = config?.accountSid || env.TWILIO_ACCOUNT_SID || "";
		this.authToken = config?.authToken || env.TWILIO_AUTH_TOKEN || "";
		this.fromNumber = config?.fromNumber || env.TWILIO_PHONE_NUMBER || "";
		this.webhookUrl = config?.webhookUrl || env.TWILIO_WEBHOOK_URL || "";
	}

	async sendMessage(message: OutgoingMessage, options?: ChannelOptions): Promise<SendResult> {
		if (!this.accountSid || !this.authToken) {
			return {
				success: false,
				error: "Twilio credentials not configured",
				timestamp: new Date(),
			};
		}

		const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

		const params = new URLSearchParams({
			To: message.to,
			From: message.from || this.fromNumber,
			Body: message.body,
		});

		if (options?.statusCallback) {
			params.append("StatusCallback", options.statusCallback);
		}

		if (options?.mediaUrl) {
			params.append("MediaUrl", options.mediaUrl);
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params.toString(),
			});

			const data = (await response.json()) as TwilioApiResponse;

			if (!response.ok) {
				logger.error({ error: data, to: message.to }, "Twilio send failed");
				return {
					success: false,
					error: data.message || "Failed to send SMS",
					timestamp: new Date(),
				};
			}

			return {
				success: true,
				externalId: data.sid,
				timestamp: new Date(),
			};
		} catch (error) {
			logger.error({ error, to: message.to }, "Twilio send exception");
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date(),
			};
		}
	}

	async parseWebhook(payload: unknown, _headers: Record<string, string>): Promise<IncomingMessage> {
		const data = payload as TwilioWebhookPayload;

		return {
			from: data.From,
			to: data.To,
			body: data.Body,
			channel: ContactChannel.SMS,
			externalId: data.MessageSid,
			timestamp: new Date(),
			metadata: {
				accountSid: data.AccountSid,
				numMedia: data.NumMedia,
				mediaUrl: data.MediaUrl0,
			},
		};
	}

	verifySignature(payload: string, signature: string, url: string): boolean {
		if (!this.authToken) {
			logger.warn("Twilio auth token not configured, skipping signature verification");
			return true;
		}

		const params = new URLSearchParams(payload);
		const sortedParams: string[] = [];

		const keys = Array.from(params.keys()).sort();
		for (const key of keys) {
			sortedParams.push(`${key}${params.get(key)}`);
		}

		const data = url + sortedParams.join("");
		const expectedSignature = crypto.createHmac("sha1", this.authToken).update(data).digest("base64");

		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
	}

	formatResponse(response: string): string[] {
		const trimmed = response.trim();

		if (trimmed.length <= SMS_MAX_LENGTH) {
			return [trimmed];
		}

		const chunks: string[] = [];
		let remaining = trimmed;

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
}
