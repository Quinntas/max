import z from "zod";

export type GetContactsDto = {
	properties: string[];
};

export interface HubSpotContact<T extends string[]> {
	id: string;
	properties: Record<T[number], string | null>;
	createdAt: string;
	updatedAt: string;
	archived: boolean;
}

export interface HubSpotContactsResponse<T extends string[] = string[]> {
	results: HubSpotContact<T>[];
	paging?: {
		next?: {
			after: string;
			link: string;
		};
	};
}

export type GetContactsResponseDto<T extends string[] = string[]> = {
	contacts: HubSpotContact<T>[];
};
