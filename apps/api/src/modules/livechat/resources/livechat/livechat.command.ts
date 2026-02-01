import { Command } from "../../../../contracts/command";
import type { WSContainer } from "../../../../infra/wsContainer";
import { logger } from "../../../../start/logger";
import type { TextSuggestionCommand } from "../../../ai/resources/textSuggestion/textSuggestion.command";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import type { GetConversationsCommand } from "../../../conversation/resources/getConversations/getConversations.command";
import type { LogActivityCommand } from "../../../hubspot/resources/logActivity/logActivity.command";
import { MessageRepo } from "../../../message/repo/message.repo";
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
		private readonly textSuggestionCommand: TextSuggestionCommand,
		private readonly logActivityCommand: LogActivityCommand,
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

				this.logMessageToHubSpot(
					message.payload.conversationPid,
					user.id,
					messageData.content,
					messageData.senderType as "HUMAN_AGENT" | "AI_AGENT",
				);
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

			case LivechatReceiveProtocolType.READY_FOR_AI_SUGGESTION: {
				const messages = await MessageRepo.getAllMessages({
					conversationPid: message.payload.conversationPid,
					userId: user.id,
				});

				const suggestion =
					await this.textSuggestionCommand.instrumentedHandle({
						conversationPid: message.payload.conversationPid,
						userId: user.id,
						conversation: messages.map((m) => ({
							senderType: m.senderType,
							content: m.content,
							contentType: m.contentType,
							createdAt: m.createdAt,
						})),
					});

				ws.send({
					type: LivechatSendProtocolType.AI_SUGGESTION,
					payload: {
						...suggestion,
						conversationPid: message.payload.conversationPid,
					},
				});
				break;
			}
		}
	}

	async onClose(user: ContextUser, ws: LiveChatDto["ws"]): Promise<void> {
		this.wsContainer.remove(ws.id);
	}

	private async logMessageToHubSpot(
		conversationPid: string,
		userId: string,
		content: string,
		senderType: "HUMAN_AGENT" | "AI_AGENT",
	): Promise<void> {
		try {
			const [conversationDetails] =
				await ConversationRepo.getConversationByPidWithDetails(
					conversationPid,
					userId,
				);

			if (!conversationDetails) {
				logger.warn({
					type: "LiveChatCommand.LogActivity.ConversationNotFound",
					conversationPid,
					userId,
				});
				return;
			}

			const { contact } = conversationDetails;

			if (contact.provider !== ContactProvider.HUBSPOT || !contact.providerId) {
				logger.info({
					type: "LiveChatCommand.LogActivity.SkippedNonHubSpot",
					conversationPid,
					provider: contact.provider,
				});
				return;
			}

			await this.logActivityCommand.instrumentedHandle({
				hubspotContactId: contact.providerId,
				message: content,
				senderType,
				timestamp: new Date(),
			});
		} catch (error) {
			logger.error({
				type: "LiveChatCommand.LogActivity.Error",
				conversationPid,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
}
