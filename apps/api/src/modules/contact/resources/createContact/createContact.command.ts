import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { ContactRepo } from "../../repo/contact.repo";
import type {
	CreateContactDto,
	CreateContactResponseDto,
} from "./createContact.dto";

export class CreateContactCommand extends Command<
	CreateContactDto,
	CreateContactResponseDto
> {
	constructor(
		private readonly createContact: typeof ContactRepo.createContact,
	) {
		super("CreateContactCommand");
	}

	async handle(dto: CreateContactDto): Promise<CreateContactResponseDto> {
		const [contact] = await this.createContact({
			userId: dto.userId,
			name: dto.name,
			email: dto.email,
			phone: dto.phone,
			provider: dto.provider,
			data: dto.data ?? {},
		});

		if (!contact) {
			throw new HttpError({
				status: 500,
				message: "Failed to create contact",
				code: "CONTACT_CREATION_FAILED",
			});
		}

		return contact;
	}
}
