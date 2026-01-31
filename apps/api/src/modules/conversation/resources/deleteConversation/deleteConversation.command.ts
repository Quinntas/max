import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ConversationRepo } from "../../repo/conversation.repo";
import type {
	DeleteConversationDto,
	DeleteConversationResponseDto,
} from "./deleteConversation.dto";

export class DeleteConversationCommand extends Command<
	DeleteConversationDto,
	DeleteConversationResponseDto
> {
	constructor(
		private readonly getConversationByPid: typeof ConversationRepo.getConversationByPid,
		private readonly deleteConversation: typeof ConversationRepo.deleteConversation,
	) {
		super("DeleteConversationCommand");
	}

	async handle(
		dto: DeleteConversationDto,
	): Promise<DeleteConversationResponseDto> {
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

		const [deletedConversation] = await this.deleteConversation(
			dto.conversationPid,
			dto.userId,
		);

		if (!deletedConversation) {
			throw new HttpError({
				status: 500,
				message: "Failed to delete conversation",
				code: "CONVERSATION_DELETE_FAILED",
			});
		}

		return deletedConversation;
	}
}
