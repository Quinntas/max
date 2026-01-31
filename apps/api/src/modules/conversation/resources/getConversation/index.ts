import { ConversationRepo } from "../../repo/conversation.repo";
import { GetConversationCommand } from "./getConversation.command";

export const getConversationCommand = new GetConversationCommand(
	ConversationRepo.getConversationByPidWithDetails,
);
