import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ContactRepo } from "../../repo/contact.repo";
import type {
	DeleteContactDto,
	DeleteContactResponseDto,
} from "./deleteContact.dto";

export class DeleteContactCommand extends Command<
	DeleteContactDto,
	DeleteContactResponseDto
> {
	constructor(
		private readonly getContactByPidAndUserId: typeof ContactRepo.getContactByPidAndUserId,
		private readonly deleteContact: typeof ContactRepo.deleteContact,
	) {
		super("DeleteContactCommand");
	}

	async handle(dto: DeleteContactDto): Promise<DeleteContactResponseDto> {
		const [existingContact] = await this.getContactByPidAndUserId(
			dto.contactPid,
			dto.userId,
		);

		if (!existingContact) {
			throw new HttpError({
				status: 404,
				message: "Contact not found",
				code: "CONTACT_NOT_FOUND",
			});
		}

		const [deletedContact] = await this.deleteContact(
			dto.contactPid,
			dto.userId,
		);

		if (!deletedContact) {
			throw new HttpError({
				status: 500,
				message: "Failed to delete contact",
				code: "CONTACT_DELETE_FAILED",
			});
		}

		return deletedContact;
	}
}
