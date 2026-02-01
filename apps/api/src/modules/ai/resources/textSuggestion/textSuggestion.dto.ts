import type {
	MessageContentType,
	MesssageSenderType,
} from "../../../message/repo/message.schema";

export interface ConversationMessageDto {
	senderType: MesssageSenderType;
	content: string;
	contentType: MessageContentType;
	createdAt?: Date;
}

export interface TextSuggestionDto {
	userId: string;
	conversationPid: string;
	conversation: ConversationMessageDto[];
}

export interface TextSuggestionResponseDto {
	messages: string[];
}
