import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ContactRepo } from "../../repo/contact.repo";
import type { GetContactDto, GetContactResponseDto } from "./getContact.dto";

export class GetContactCommand extends Command<
	GetContactDto,
	GetContactResponseDto
> {
	constructor(
		private readonly getContactByPidAndUserId: typeof ContactRepo.getContactByPidAndUserId,
	) {
		super("GetContactCommand");
	}

	async handle(dto: GetContactDto): Promise<GetContactResponseDto> {
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

		return {
			pid: contact.pid,
			name: contact.name,
			email: contact.email,
			phone: contact.phone,
			data: contact.data,
			provider: contact.provider,
			createdAt: contact.createdAt,
			updatedAt: contact.updatedAt,
		};
	}
}
