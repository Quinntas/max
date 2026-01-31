import type { ContactSelectModel } from "../../repo/contact.schema";

export interface UpdateContactDto {
	userId: string;
	contactPid: string;
	name?: string;
	email?: string;
	phone?: string;
	data?: {
		notes?: string;
	};
}

export type UpdateContactResponseDto = ContactSelectModel;
