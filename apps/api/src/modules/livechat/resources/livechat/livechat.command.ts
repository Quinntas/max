import { SpanStatusCode } from "@opentelemetry/api";
import { Command } from "../../../../contracts/command";
import type { WSContainer } from "../../../../infra/wsContainer";
import { logger } from "../../../../start/logger";
import type { TextSuggestionCommand } from "../../../ai/resources/textSuggestion/textSuggestion.command";
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
		return this.tracer.startActiveSpan(
			`${this.tracerName}.onMessage`,
			{
				attributes: {
					"livechat.message_type": message.type,
					"livechat.user_id": user.id,
					"livechat.ws_id": ws.id,
				},
			},
			async (span) => {
				const startTime = performance.now();

				logger.info({
					msg: "WebSocket message received",
					type: message.type,
					userId: user.id,
					wsId: ws.id,
				});

				try {
					switch (message.type) {
						case LivechatReceiveProtocolType.SEND_MESSAGE: {
							span.setAttribute(
								"livechat.conversation_pid",
								message.payload.conversationPid,
							);

							logger.info({
								msg: "Processing send message request",
								conversationPid: message.payload.conversationPid,
								userId: user.id,
							});

							await this.createMessageCommand.instrumentedHandle({
								...message.payload,
								userId: user.id,
							});

							logger.info({
								msg: "Message created successfully",
								conversationPid: message.payload.conversationPid,
								userId: user.id,
							});
							break;
						}

						case LivechatReceiveProtocolType.GET_MESSAGES: {
							span.setAttribute(
								"livechat.conversation_pid",
								message.payload.conversationPid,
							);

							logger.info({
								msg: "Fetching messages",
								conversationPid: message.payload.conversationPid,
								userId: user.id,
							});

							const messages = await this.getMessagesCommand.instrumentedHandle(
								{
									...message.payload,
									userId: user.id,
								},
							);

							span.setAttribute("livechat.messages_count", messages.data.length);

							logger.info({
								msg: "Messages fetched successfully",
								conversationPid: message.payload.conversationPid,
								messagesCount: messages.data.length,
								userId: user.id,
							});

							ws.send({
								type: LivechatSendProtocolType.GET_MESSAGES,
								payload: messages,
							});
							break;
						}

						case LivechatReceiveProtocolType.GET_CONVERSATIONS: {
							logger.info({
								msg: "Fetching conversations",
								userId: user.id,
							});

							const conversations =
								await this.getConversationCommand.instrumentedHandle({
									...message.payload,
									userId: user.id,
								});

							span.setAttribute(
								"livechat.conversations_count",
								conversations.data.length,
							);

							logger.info({
								msg: "Conversations fetched successfully",
								conversationsCount: conversations.data.length,
								userId: user.id,
							});

							ws.send({
								type: LivechatSendProtocolType.GET_CONVERSATIONS,
								payload: conversations,
							});
							break;
						}

						case LivechatReceiveProtocolType.READY_FOR_AI_SUGGESTION: {
							span.setAttribute(
								"livechat.conversation_pid",
								message.payload.conversationPid,
							);

							logger.info({
								msg: "AI suggestion requested",
								conversationPid: message.payload.conversationPid,
								userId: user.id,
							});

							const messagesForSuggestion = await MessageRepo.getAllMessages({
								conversationPid: message.payload.conversationPid,
								userId: user.id,
							});

							span.setAttribute(
								"livechat.context_messages_count",
								messagesForSuggestion.length,
							);

							logger.info({
								msg: "Generating AI suggestion",
								conversationPid: message.payload.conversationPid,
								contextMessagesCount: messagesForSuggestion.length,
								userId: user.id,
							});

							const suggestion =
								await this.textSuggestionCommand.instrumentedHandle({
									conversationPid: message.payload.conversationPid,
									userId: user.id,
									conversation: messagesForSuggestion.map((m) => ({
										senderType: m.senderType,
										content: m.content,
										contentType: m.contentType,
										createdAt: m.createdAt,
									})),
								});

							logger.info({
								msg: "AI suggestion generated successfully",
								conversationPid: message.payload.conversationPid,
								suggestionsCount: suggestion.messages.length,
								userId: user.id,
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

					span.setStatus({ code: SpanStatusCode.OK });
				} catch (error) {
					if (error instanceof Error) {
						span.recordException(error);
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: error.message,
						});

						logger.error({
							msg: "WebSocket message handling failed",
							type: message.type,
							userId: user.id,
							wsId: ws.id,
							error: error.message,
							stack: error.stack,
						});
					}
					throw error;
				} finally {
					const duration = performance.now() - startTime;
					span.setAttribute("livechat.duration_ms", duration);

					logger.info({
						msg: "WebSocket message processed",
						type: message.type,
						userId: user.id,
						durationMs: Math.round(duration),
					});

					span.end();
				}
			},
		);
	}

	async onClose(user: ContextUser, ws: LiveChatDto["ws"]): Promise<void> {
		this.wsContainer.remove(ws.id);
	}

}
