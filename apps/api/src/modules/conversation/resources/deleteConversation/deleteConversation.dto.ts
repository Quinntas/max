import type { ConversationSelectModel } from "../../repo/conversation.schema";

export interface DeleteConversationDto {
	userId: string;
	conversationPid: string;
}

export type DeleteConversationResponseDto = ConversationSelectModel;
