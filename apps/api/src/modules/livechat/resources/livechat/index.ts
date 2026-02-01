import { wsContainer } from "../../../../start/wsContainer";
import { textSuggestionCommand } from "../../../ai/resources/textSuggestion";
import { getConversationsCommand } from "../../../conversation/resources/getConversations";
import { logActivityCommand } from "../../../hubspot/resources/logActivity";
import { createMessageCommand } from "../../../message/resources/createMessage";
import { getMessagesCommand } from "../../../message/resources/getMessages";
import { LiveChatCommand } from "./livechat.command";

export const liveChatCommand = new LiveChatCommand(
	wsContainer,
	getConversationsCommand,
	createMessageCommand,
	getMessagesCommand,
	textSuggestionCommand,
	logActivityCommand,
);
