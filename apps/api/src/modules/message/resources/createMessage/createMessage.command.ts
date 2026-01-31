import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import type { MessageRepo } from "../../repo/message.repo";
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

		return message;
	}
}
