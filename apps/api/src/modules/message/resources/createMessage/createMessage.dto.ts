import type {
	MessageContentType,
	MessageSelectModel,
	MesssageSenderType,
} from "../../repo/message.schema";

export interface CreateMessageDto {
	userId: string;
	conversationPid: string;
	senderType: MesssageSenderType;
	content: string;
	contentType: MessageContentType;
}

export type CreateMessageResponseDto = MessageSelectModel;
