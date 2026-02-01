import axios, { AxiosError } from "axios";
import { Command } from "../../../../contracts/command";
import { logger } from "../../../../start/logger";
import type {
	HubSpotNoteResponse,
	LogActivityDto,
	LogActivityResponseDto,
} from "./logActivity.dto";

export class LogActivityCommand extends Command<
	LogActivityDto,
	LogActivityResponseDto
> {
	constructor(private readonly apiKey: string) {
		super("LogActivityCommand");
	}

	async handle(dto: LogActivityDto): Promise<LogActivityResponseDto> {
		const timestamp = dto.timestamp ?? new Date();
		const senderLabel =
			dto.senderType === "HUMAN_AGENT" ? "Agent" : "AI Assistant";

		const noteBody = `[${senderLabel}] ${dto.message}`;

		try {
			const noteResponse = await axios.post<HubSpotNoteResponse>(
				"https://api.hubapi.com/crm/v3/objects/notes",
				{
					properties: {
						hs_timestamp: timestamp.toISOString(),
						hs_note_body: noteBody,
					},
					associations: [
						{
							to: {
								id: dto.hubspotContactId,
							},
							types: [
								{
									associationCategory: "HUBSPOT_DEFINED",
									associationTypeId: 202,
								},
							],
						},
					],
				},
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
					},
				},
			);

			logger.info({
				type: "LogActivityCommand.Success",
				hubspotContactId: dto.hubspotContactId,
				engagementId: noteResponse.data.id,
			});

			return {
				success: true,
				engagementId: noteResponse.data.id,
			};
		} catch (error) {
			if (error instanceof AxiosError) {
				logger.error({
					type: "LogActivityCommand.HubSpotApiError",
					message: error.message,
					data: error.response?.data,
					status: error.response?.status,
					correlationId: error.response?.data?.correlationId,
					hubspotContactId: dto.hubspotContactId,
				});

				return {
					success: false,
					error: error.message,
				};
			}

			logger.error({
				type: "LogActivityCommand.UnknownError",
				message: error instanceof Error ? error.message : "Unknown error",
				hubspotContactId: dto.hubspotContactId,
			});

			return {
				success: false,
				error: "Unknown error occurred",
			};
		}
	}
}
