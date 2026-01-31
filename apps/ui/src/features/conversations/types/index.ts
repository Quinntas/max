export type ConversationStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export type MessageSenderType = "COSTUMER" | "AI_AGENT" | "HUMAN_AGENT";

export type MessageContentType = "TEXT";

export interface Contact {
	pid: string;
	name: string;
	email: string;
	phone: string;
	data: {
		notes?: string;
	};
	provider: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

export interface ConversationMetadata {
	pid: string;
	status: ConversationStatus | string;
	lastMessageAt: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

export interface Conversation {
	conversation: ConversationMetadata;
	user: User;
	contact: Contact;
}

export interface Message {
	pid: string;
	senderType: MessageSenderType;
	content: string;
	contentType: MessageContentType;
	createdAt: string | Date;
	updatedAt: string | Date;
	conversationPid?: string;
}

export interface Pagination {
	total: number;
	isMore: boolean;
	nextOffset: number | null;
}
