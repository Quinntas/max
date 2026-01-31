import { ConversationRepo } from "../../repo/conversation.repo";
import { GetConversationsCommand } from "./getConversations.command";

export const getConversationsCommand = new GetConversationsCommand(
	ConversationRepo.getConversations,
	ConversationRepo.countConversations,
);
