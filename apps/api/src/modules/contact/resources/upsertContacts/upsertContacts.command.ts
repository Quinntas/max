import { Command } from "../../../../contracts/command";
import { logger } from "../../../../start/logger";
import type { ContactRepo } from "../../repo/contact.repo";
import type { ContactInsertModel } from "../../repo/contact.schema";
import type {
	UpsertContactsDto,
	UpsertContactsResponseDto,
} from "./upsertContacts.dto";

export class UpsertContactsCommand extends Command<
	UpsertContactsDto,
	UpsertContactsResponseDto
> {
	constructor(
		private readonly getContactByPidAndUserId: typeof ContactRepo.getContactByPidAndUserId,
		private readonly updateContact: typeof ContactRepo.updateContact,
		private readonly createContact: typeof ContactRepo.createContact,
	) {
		super("UpserContactCommand");
	}

	async handle(dto: UpsertContactsDto): Promise<void> {
		await Promise.allSettled(
			dto.contact.map(async (contact) => {
				if (!contact) return;

				try {
					const [foundContact] = await this.getContactByPidAndUserId(
						contact.pid,
						dto.userId,
					);

					if (foundContact) {
						try {
							await this.updateContact(contact.pid, contact);
						} catch (error) {
							logger.error({
								type: `${this.tracerName}.updateContact`,
								error,
							});
						}
					} else {
						try {
							await this.createContact(contact as ContactInsertModel);
						} catch (error) {
							logger.error({
								type: `${this.tracerName}.createContact`,
								error,
							});
						}
					}
				} catch (error) {
					logger.error({
						type: `${this.tracerName}.getContactByPidAndUserId`,
						error,
					});
				}
			}),
		);
	}
}
