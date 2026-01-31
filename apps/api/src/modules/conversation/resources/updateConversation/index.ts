import { ConversationRepo } from "../../repo/conversation.repo";
import { UpdateConversationCommand } from "./updateConversation.command";

export const updateConversationCommand = new UpdateConversationCommand(
	ConversationRepo.getConversationByPid,
	ConversationRepo.updateConversation,
);
