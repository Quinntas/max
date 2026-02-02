import type { ContactProvider } from "../../../contact/repo/contact.schema";
import { MessageSelectModel, PublicMessage } from "../../../message/repo/message.schema";
import type { ConversationStatus } from "../../repo/conversation.schema";

export interface GetConversationsDto {
	userId: string;
	contactPid?: string;
	status?: ConversationStatus;
	limit: number;
	offset: number;
	sort?: "asc" | "desc";
}

export interface ConversationWithDetails {
	conversation: {
		pid: string;
		status: ConversationStatus;
		lastMessageAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	};
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	contact: {
		pid: string;
		name: string;
		email: string;
		phone: string;
		data: {
			notes?: string;
		} & Record<string, unknown>;
		provider: ContactProvider;
  };
  lastMessage: Omit<PublicMessage, 'conversationPid'> | null
}

export interface GetConversationsResponseDto {
	data: ConversationWithDetails[];
	pagination: {
		total: number;
		isMore: boolean;
		nextOffset: number | null;
	};
}
