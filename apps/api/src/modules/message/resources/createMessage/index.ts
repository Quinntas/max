import { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import { MessageRepo } from "../../repo/message.repo";
import { CreateMessageCommand } from "./createMessage.command";

export const createMessageCommand = new CreateMessageCommand(
	ConversationRepo.getConversationByPid,
	MessageRepo.createMessage,
	ConversationRepo.updateLastMessageAt,
);
