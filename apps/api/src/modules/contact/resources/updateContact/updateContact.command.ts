import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ContactRepo } from "../../repo/contact.repo";
import type {
	UpdateContactDto,
	UpdateContactResponseDto,
} from "./updateContact.dto";

export class UpdateContactCommand extends Command<
	UpdateContactDto,
	UpdateContactResponseDto
> {
	constructor(
		private readonly getContactByPidAndUserId: typeof ContactRepo.getContactByPidAndUserId,
		private readonly updateContactByPidAndUserId: typeof ContactRepo.updateContactByPidAndUserId,
	) {
		super("UpdateContactCommand");
	}

	async handle(dto: UpdateContactDto): Promise<UpdateContactResponseDto> {
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

		const updateData: {
			name?: string;
			email?: string;
			phone?: string;
			data?: { notes?: string };
		} = {};

		if (dto.name !== undefined) {
			updateData.name = dto.name;
		}
		if (dto.email !== undefined) {
			updateData.email = dto.email;
		}
		if (dto.phone !== undefined) {
			updateData.phone = dto.phone;
		}
		if (dto.data !== undefined) {
			updateData.data = dto.data;
		}

		if (Object.keys(updateData).length === 0) {
			return existingContact;
		}

		const [contact] = await this.updateContactByPidAndUserId(
			dto.contactPid,
			dto.userId,
			updateData,
		);

		if (!contact) {
			throw new HttpError({
				status: 500,
				message: "Failed to update contact",
				code: "CONTACT_UPDATE_FAILED",
			});
		}

		return contact;
	}
}
