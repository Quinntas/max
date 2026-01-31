import { wsContainer } from "../../../../start/wsContainer";
import { getConversationsCommand } from "../../../conversation/resources/getConversations";
import { createMessageCommand } from "../../../message/resources/createMessage";
import { getMessagesCommand } from "../../../message/resources/getMessages";
import { LiveChatCommand } from "./livechat.command";

export const liveChatCommand = new LiveChatCommand(
	wsContainer,
	getConversationsCommand,
	createMessageCommand,
	getMessagesCommand,
);
