import { ConversationRepo } from "../../repo/conversation.repo";
import { DeleteConversationCommand } from "./deleteConversation.command";

export const deleteConversationCommand = new DeleteConversationCommand(
	ConversationRepo.getConversationByPid,
	ConversationRepo.deleteConversation,
);
