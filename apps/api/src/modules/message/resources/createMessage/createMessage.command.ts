import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { WSContainer } from "../../../../infra/wsContainer";
import { logger } from "../../../../start/logger";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import type { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import { LogActivityCommand } from "../../../hubspot/resources/logActivity/logActivity.command";
import { LivechatSendProtocolType } from "../../../livechat/core/protocol";
import type { MessageRepo } from "../../repo/message.repo";
import { MesssageSenderType } from "../../repo/message.schema";
import type {
	CreateMessageDto,
	CreateMessageResponseDto,
} from "./createMessage.dto";

export class CreateMessageCommand extends Command<
	CreateMessageDto,
	CreateMessageResponseDto
> {
	constructor(
		private readonly getConversationByPid: typeof ConversationRepo.getConversationByPid,
		private readonly createMessage: typeof MessageRepo.createMessage,
		private readonly updateLastMessageAt: typeof ConversationRepo.updateLastMessageAt,
    private readonly wsContainer: WSContainer,
    private readonly getConversationByPidWithDetails: typeof ConversationRepo.getConversationByPidWithDetails,
    private readonly logActivityCommand: LogActivityCommand
	) {
		super("CreateMessageCommand");
	}

	async handle(dto: CreateMessageDto): Promise<CreateMessageResponseDto> {
		const [conversation] = await this.getConversationByPid(
			dto.conversationPid,
			dto.userId,
		);

		if (!conversation) {
			throw new HttpError({
				status: 404,
				message: "Conversation not found",
				code: "CONVERSATION_NOT_FOUND",
			});
		}

		const [message] = await this.createMessage({
			conversationId: conversation.id,
			senderType: dto.senderType,
			content: dto.content,
			contentType: dto.contentType,
		});

		if (!message) {
			throw new HttpError({
				status: 500,
				message: "Failed to create message",
				code: "MESSAGE_CREATION_FAILED",
			});
		}

    await this.updateLastMessageAt(dto.conversationPid, dto.userId);

    await this.wsContainer.send(dto.userId, {
      type: LivechatSendProtocolType.NEW_MESSAGE,
      payload: {
        ...message,
        conversationPid: dto.conversationPid
      }
    })

    if (message.senderType !== MesssageSenderType.COSTUMER)
      this.logMessageToHubSpot(
					dto.conversationPid,
					dto.userId,
					message.content,
					message.senderType ,
				);

		return message;
  }

  private async logMessageToHubSpot(
		conversationPid: string,
		userId: string,
		content: string,
		senderType: "HUMAN_AGENT" | "AI_AGENT",
	): Promise<void> {
		try {
			const [conversationDetails] =
				await this.getConversationByPidWithDetails(
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
