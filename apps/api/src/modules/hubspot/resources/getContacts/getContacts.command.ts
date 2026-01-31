import axios, { AxiosError } from "axios";
import { Command } from "../../../../contracts/command";
import { logger } from "../../../../start/logger";
import type {
	GetContactsDto,
	GetContactsResponseDto,
	HubSpotContact,
	HubSpotContactsResponse,
} from "./getContacts.dto";

export class GetContactsCommand extends Command<
	GetContactsDto,
	GetContactsResponseDto
> {
	constructor(
		private readonly apiKey: string,
		private readonly requestDelayMs: number = 100,
	) {
		super("GetContactCommand");
	}

	async handle<T extends GetContactsDto>(
		dto: T,
	): Promise<GetContactsResponseDto<T["properties"]>> {
		const properties = dto.properties.join(",");
		const contacts: HubSpotContact<T["properties"]>[] = [];

		for await (const batch of this.fetchContacts<T["properties"]>(properties)) {
			contacts.push(...batch);
		}

		return { contacts };
	}

	private async *fetchContacts<T extends string[]>(
		properties: string,
	): AsyncGenerator<HubSpotContact<T>[]> {
		let after: string | undefined;

		do {
			try {
				await new Promise((resolve) =>
					setTimeout(resolve, this.requestDelayMs),
				);

				const response = await axios.get<HubSpotContactsResponse<T>>(
					"https://api.hubapi.com/crm/v3/objects/contacts",
					{
						params: {
							limit: 100,
							after: after,
							properties,
						},
						headers: {
							Authorization: `Bearer ${this.apiKey}`,
							"private-app": this.apiKey,
							"Content-Type": "application/json",
						},
					},
				);

				if (response.data.results.length > 0) {
					yield response.data.results;
				}

				after = response.data.paging?.next?.after;
			} catch (error) {
				if (error instanceof AxiosError) {
					logger.error({
						type: "RebaseContactCommand.HubSpotApiError",
						message: error.message,
						data: error.response?.data,
						status: error.response?.status,
						correlationId: error.response?.data?.correlationId,
					});
				}
			}
		} while (after);
	}
}
