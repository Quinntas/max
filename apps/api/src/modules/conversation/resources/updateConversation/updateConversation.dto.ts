import type {
	ConversationSelectModel,
	ConversationStatus,
} from "../../repo/conversation.schema";

export interface UpdateConversationDto {
	userId: string;
	conversationPid: string;
	status?: ConversationStatus;
}

export type UpdateConversationResponseDto = ConversationSelectModel;
