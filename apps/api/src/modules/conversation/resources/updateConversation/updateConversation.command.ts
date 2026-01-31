import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ConversationRepo } from "../../repo/conversation.repo";
import type {
	UpdateConversationDto,
	UpdateConversationResponseDto,
} from "./updateConversation.dto";

export class UpdateConversationCommand extends Command<
	UpdateConversationDto,
	UpdateConversationResponseDto
> {
	constructor(
		private readonly getConversationByPid: typeof ConversationRepo.getConversationByPid,
		private readonly updateConversation: typeof ConversationRepo.updateConversation,
	) {
		super("UpdateConversationCommand");
	}

	async handle(
		dto: UpdateConversationDto,
	): Promise<UpdateConversationResponseDto> {
		const [existingConversation] = await this.getConversationByPid(
			dto.conversationPid,
			dto.userId,
		);

		if (!existingConversation) {
			throw new HttpError({
				status: 404,
				message: "Conversation not found",
				code: "CONVERSATION_NOT_FOUND",
			});
		}

		const updateData: { status?: typeof dto.status } = {};

		if (dto.status !== undefined) {
			updateData.status = dto.status;
		}

		if (Object.keys(updateData).length === 0) {
			return existingConversation;
		}

		const [conversation] = await this.updateConversation(
			dto.conversationPid,
			dto.userId,
			updateData,
		);

		if (!conversation) {
			throw new HttpError({
				status: 500,
				message: "Failed to update conversation",
				code: "CONVERSATION_UPDATE_FAILED",
			});
		}

		return conversation;
	}
}
