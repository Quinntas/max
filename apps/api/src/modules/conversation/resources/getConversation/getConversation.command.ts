import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ConversationRepo } from "../../repo/conversation.repo";
import type {
	GetConversationDto,
	GetConversationResponseDto,
} from "./getConversation.dto";

export class GetConversationCommand extends Command<
	GetConversationDto,
	GetConversationResponseDto
> {
	constructor(
		private readonly getConversationByPidWithDetails: typeof ConversationRepo.getConversationByPidWithDetails,
	) {
		super("GetConversationCommand");
	}

	async handle(dto: GetConversationDto): Promise<GetConversationResponseDto> {
		const [conversation] = await this.getConversationByPidWithDetails(
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

		return conversation;
	}
}
