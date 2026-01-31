import type {
	GetConversationsDto,
	GetConversationsResponseDto,
} from "../../conversation/resources/getConversations/getConversations.dto";
import type { PublicMessage } from "../../message/repo/message.schema";
import type { CreateMessageDto } from "../../message/resources/createMessage/createMessage.dto";
import type {
	GetMessagesDto,
	GetMessagesResponseDto,
} from "../../message/resources/getMessages/getMessages.dto";

// Receive
export enum LivechatReceiveProtocolType {
	GET_CONVERSATIONS = "GET_CONVERSATIONS",
	GET_MESSAGES = "GET_MESSAGES",
	SEND_MESSAGE = "SEND_MESSAGE",
	START_TYPING = "START_TYPING",
	STOP_TYPING = "STOP_TYPING",
}

export type LivechatReceiveProtocol =
	| {
			type: LivechatReceiveProtocolType.GET_CONVERSATIONS;
			payload: Omit<GetConversationsDto, "userId">;
	  }
	| {
			type: LivechatReceiveProtocolType.GET_MESSAGES;
			payload: Omit<GetMessagesDto, "userId">;
	  }
	| {
			type: LivechatReceiveProtocolType.SEND_MESSAGE;
			payload: CreateMessageDto;
	  }
	| {
			type: LivechatReceiveProtocolType.START_TYPING;
			payload: {
				conversationPid: string;
			};
	  }
	| {
			type: LivechatReceiveProtocolType.STOP_TYPING;
			payload: {
				conversationPid: string;
			};
	  };

// Send
export enum LivechatSendProtocolType {
	GET_CONVERSATIONS = "GET_CONVERSATIONS",
	GET_MESSAGES = "GET_MESSAGES",
	NEW_MESSAGE = "NEW_MESSAGE",
	ERROR = "ERROR",
}

export type LivechatSendProtocol =
	| {
			type: LivechatSendProtocolType.GET_CONVERSATIONS;
			payload: GetConversationsResponseDto;
	  }
	| {
			type: LivechatSendProtocolType.GET_MESSAGES;
			payload: GetMessagesResponseDto;
	  }
	| {
			type: LivechatSendProtocolType.NEW_MESSAGE;
			payload: PublicMessage;
	  }
	| {
			type: LivechatSendProtocolType.ERROR;
			payload: {
				message: string;
				code?: string;
			};
	  };
