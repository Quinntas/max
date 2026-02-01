export interface LogActivityDto {
	hubspotContactId: string;
	message: string;
	senderType: "HUMAN_AGENT" | "AI_AGENT";
	timestamp?: Date;
}

export interface LogActivityResponseDto {
	success: boolean;
	engagementId?: string;
	error?: string;
}

export interface HubSpotNoteResponse {
	id: string;
	properties: {
		hs_timestamp: string;
		hs_note_body: string;
		hubspot_owner_id: string;
	};
	createdAt: string;
	updatedAt: string;
	archived: boolean;
}
