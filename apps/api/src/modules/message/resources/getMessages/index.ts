import { MessageRepo } from "../../repo/message.repo";
import { GetMessagesCommand } from "./getMessages.command";

export const getMessagesCommand = new GetMessagesCommand(
	MessageRepo.getMessages,
	MessageRepo.countMessages,
);
