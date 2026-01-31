import type {
	MessageContentType,
	MesssageSenderType,
} from "../../repo/message.schema";

export interface GetMessagesDto {
	userId: string;
	conversationPid: string;
	limit: number;
	offset: number;
	sort?: "asc" | "desc";
}

export interface MessageResponseItem {
	pid: string;
	senderType: MesssageSenderType;
	content: string;
	contentType: MessageContentType;
	createdAt: Date;
	updatedAt: Date;
}

export interface GetMessagesResponseDto {
	data: MessageResponseItem[];
	pagination: {
		total: number;
		isMore: boolean;
		nextOffset: number | null;
	};
}
