import { randomUUID } from "node:crypto";
import { Command } from "../../../../contracts/command";
import { logger } from "../../../../start/logger";
import type { ContactRepo } from "../../../contact/repo/contact.repo";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import type { UpsertContactsCommand } from "../../../contact/resources/upsertContacts/upsertContacts.command";
import type { UpsertContactsDto } from "../../../contact/resources/upsertContacts/upsertContacts.dto";
import type { GetContactsCommand } from "../getContacts/getContacts.command";
import type { HubSpotContact } from "../getContacts/getContacts.dto";
import type { RebaseContactsDto } from "./rebaseContacts.dto";

export class RebaseContactsCommand extends Command<RebaseContactsDto, void> {
	private readonly BATCH_SIZE = 50;

	constructor(
		private readonly getContactsCommand: GetContactsCommand,
		private readonly upsertContactsCommand: UpsertContactsCommand,
		private readonly getContactIdentifiersByUserId: typeof ContactRepo.getContactIdentifiersByUserId,
	) {
		super("RebaseContactsCommand");
	}

	async handle(dto: RebaseContactsDto): Promise<void> {
		try {
			const hubspotContacts = await this.fetchHubSpotContacts();

			if (!hubspotContacts.length) {
				logger.info({
					type: this.tracerName,
					message: "No contacts found in HubSpot",
					userId: dto.userId,
				});
				return;
			}

			const existingContactsMap = await this.getExistingContactsMap(dto.userId);
			const contactsToUpsert = this.mapContactsToUpsert(
				hubspotContacts,
				existingContactsMap,
				dto.userId,
			);

			await this.processBatches(contactsToUpsert, dto.userId);
		} catch (error) {
			logger.error({
				type: `${this.tracerName}.error`,
				message: "Failed to rebase HubSpot contacts",
				error,
				userId: dto.userId,
			});
			throw error;
		}
	}

	private async fetchHubSpotContacts(): Promise<HubSpotContact<string[]>[]> {
		const response = await this.getContactsCommand.handle({
			properties: ["name", "email", "phone", "notes"],
		});
		return response.contacts;
	}

	private async getExistingContactsMap(
		userId: string,
	): Promise<Map<string, string>> {
		const existingContacts = await this.getContactIdentifiersByUserId(
			userId,
			ContactProvider.HUBSPOT,
		);
		const map = new Map<string, string>();

		for (const contact of existingContacts)
			if (contact.providerId) map.set(contact.providerId, contact.pid);

		return map;
	}

	private mapContactsToUpsert(
		hubspotContacts: HubSpotContact<string[]>[],
		existingContactsMap: Map<string, string>,
		userId: string,
	): UpsertContactsDto["contact"] {
		return hubspotContacts.map((hsContact) => {
			const providerId = hsContact.id;
			const existingPid = existingContactsMap.get(providerId);
			const pid = existingPid ?? randomUUID();

			const { name, email, phone, ...data } = hsContact.properties;

			return {
				pid,
				userId,
				name: name ?? "",
				email: email ?? "",
				phone: phone ?? "",
				provider: ContactProvider.HUBSPOT,
				providerId,
				data,
			};
		});
	}

	private async processBatches(
		contacts: UpsertContactsDto["contact"],
		userId: string,
	): Promise<void> {
		for (let i = 0; i < contacts.length; i += this.BATCH_SIZE) {
			const batch = contacts.slice(i, i + this.BATCH_SIZE);

			await this.upsertContactsCommand.instrumentedHandle({
				userId,
				contact: batch,
			});
		}
	}
}
