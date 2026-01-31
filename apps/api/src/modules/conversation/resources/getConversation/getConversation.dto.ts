import type { ConversationWithDetails } from "../getConversations/getConversations.dto";

export interface GetConversationDto {
	userId: string;
	conversationPid: string;
}

export type GetConversationResponseDto = ConversationWithDetails;
