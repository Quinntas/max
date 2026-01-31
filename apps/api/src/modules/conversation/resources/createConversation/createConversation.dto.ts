import type {
	ConversationSelectModel,
	ConversationStatus,
} from "../../repo/conversation.schema";

export interface CreateConversationDto {
	userId: string;
	contactPid: string;
	status?: ConversationStatus;
}

export type CreateConversationResponseDto = ConversationSelectModel;
