import { Command } from "../../../../contracts/command";
import type { WSContainer } from "../../../../infra/wsContainer";
import type { GetConversationsCommand } from "../../../conversation/resources/getConversations/getConversations.command";
import type { CreateMessageCommand } from "../../../message/resources/createMessage/createMessage.command";
import type { GetMessagesCommand } from "../../../message/resources/getMessages/getMessages.command";
import {
	LivechatReceiveProtocolType,
	LivechatSendProtocolType,
} from "../../core/protocol";
import type {
	ContextUser,
	LiveChatBodyType,
	LiveChatDto,
	LiveChatResponseDto,
} from "./livechat.dto";

export class LiveChatCommand extends Command<LiveChatDto, LiveChatResponseDto> {
	constructor(
		private readonly wsContainer: WSContainer,
		private readonly getConversationCommand: GetConversationsCommand,
		private readonly createMessageCommand: CreateMessageCommand,
		private readonly getMessagesCommand: GetMessagesCommand,
	) {
		super("LivechatCommand");
	}

	async handle(dto: LiveChatDto): Promise<void> {
		this.wsContainer.add(dto.user, dto.ws);
	}

	async onMessage(
		user: ContextUser,
		ws: LiveChatDto["ws"],
		message: LiveChatBodyType,
	): Promise<void> {
		switch (message.type) {
			case LivechatReceiveProtocolType.SEND_MESSAGE: {
				const messageData = await this.createMessageCommand.instrumentedHandle({
					...message.payload,
					userId: user.id,
				});

				await this.wsContainer.send(user.id, {
					type: LivechatSendProtocolType.NEW_MESSAGE,
					payload: {
						pid: messageData.pid,
						senderType: messageData.senderType,
						content: messageData.content,
						contentType: messageData.contentType,
						conversationPid: message.payload.conversationPid,
						createdAt: messageData.createdAt,
						updatedAt: messageData.updatedAt,
					},
				});
				break;
			}

			case LivechatReceiveProtocolType.GET_MESSAGES: {
				const messages = await this.getMessagesCommand.instrumentedHandle({
					...message.payload,
					userId: user.id,
				});

				ws.send({
					type: LivechatSendProtocolType.GET_MESSAGES,
					payload: messages,
				});
				break;
			}

			case LivechatReceiveProtocolType.GET_CONVERSATIONS: {
				const conversations =
					await this.getConversationCommand.instrumentedHandle({
						...message.payload,
						userId: user.id,
					});

				ws.send({
					type: LivechatSendProtocolType.GET_CONVERSATIONS,
					payload: conversations,
				});
				break;
			}
		}
	}

	async onClose(user: ContextUser, ws: LiveChatDto["ws"]): Promise<void> {
		this.wsContainer.remove(ws.id);
	}
}
