import { wsContainer } from "../../../../start/wsContainer";
import { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import { logActivityCommand } from "../../../hubspot/resources/logActivity";
import { MessageRepo } from "../../repo/message.repo";
import { CreateMessageCommand } from "./createMessage.command";

export const createMessageCommand = new CreateMessageCommand(
	ConversationRepo.getConversationByPid,
	MessageRepo.createMessage,
	ConversationRepo.updateLastMessageAt,
  wsContainer,
  ConversationRepo.getConversationByPidWithDetails,
  logActivityCommand
);
