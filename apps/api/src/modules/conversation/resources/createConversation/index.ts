import { ContactRepo } from "../../../contact/repo/contact.repo";
import { ConversationRepo } from "../../repo/conversation.repo";
import { CreateConversationCommand } from "./createConversation.command";

export const createConversationCommand = new CreateConversationCommand(
	ContactRepo.getContactByPidAndUserId,
	ConversationRepo.createConversation,
);
