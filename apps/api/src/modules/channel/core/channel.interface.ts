import type { ContactChannel } from "../../contact/repo/contact.schema";

export interface IncomingMessage {
	from: string;
	to: string;
	body: string;
	channel: ContactChannel;
	externalId: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

export interface OutgoingMessage {
	to: string;
	from: string;
	body: string;
	channel: ContactChannel;
	metadata?: Record<string, unknown>;
}

export interface SendResult {
	success: boolean;
	externalId?: string;
	error?: string;
	timestamp: Date;
}

export interface ChannelOptions {
	mediaUrl?: string;
	callbackUrl?: string;
	statusCallback?: string;
}

export interface ChannelProvider {
	readonly channel: ContactChannel;
	sendMessage(message: OutgoingMessage, options?: ChannelOptions): Promise<SendResult>;
	parseWebhook(payload: unknown, headers: Record<string, string>): Promise<IncomingMessage>;
	verifySignature(payload: string, signature: string, url: string): boolean;
	formatResponse(response: string): string[];
}

export interface ChannelConfig {
	accountSid?: string;
	authToken?: string;
	apiKey?: string;
	fromNumber?: string;
	fromEmail?: string;
	webhookUrl?: string;
}
