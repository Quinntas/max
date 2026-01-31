import type { ContactProvider } from "../../repo/contact.schema";
import type { PublicContact } from "../getContact/getContact.dto";

export interface GetContactsDto {
	userId: string;
	search?: string;
	provider?: ContactProvider;
	limit: number;
	offset: number;
	sort?: "asc" | "desc";
}

export interface GetContactsResponseDto {
	data: PublicContact[];
	pagination: {
		total: number;
		isMore: boolean;
		nextOffset: number | null;
	};
}
