import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ContactRepo } from "../../../contact/repo/contact.repo";
import type { ConversationRepo } from "../../repo/conversation.repo";
import { ConversationStatus } from "../../repo/conversation.schema";
import type {
	CreateConversationDto,
	CreateConversationResponseDto,
} from "./createConversation.dto";

export class CreateConversationCommand extends Command<
	CreateConversationDto,
	CreateConversationResponseDto
> {
	constructor(
		private readonly getContactByPidAndUserId: typeof ContactRepo.getContactByPidAndUserId,
		private readonly createConversation: typeof ConversationRepo.createConversation,
	) {
		super("CreateConversationCommand");
	}

	async handle(
		dto: CreateConversationDto,
	): Promise<CreateConversationResponseDto> {
		const [contact] = await this.getContactByPidAndUserId(
			dto.contactPid,
			dto.userId,
		);

		if (!contact) {
			throw new HttpError({
				status: 404,
				message: "Contact not found",
				code: "CONTACT_NOT_FOUND",
			});
		}

		const [conversation] = await this.createConversation({
			userId: dto.userId,
			contactId: contact.id,
			status: dto.status ?? ConversationStatus.NEW,
		});

		if (!conversation) {
			throw new HttpError({
				status: 500,
				message: "Failed to create conversation",
				code: "CONVERSATION_CREATION_FAILED",
			});
		}

		return conversation;
	}
}
