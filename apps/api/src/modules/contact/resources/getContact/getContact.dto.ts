import type { ContactProvider } from "../../repo/contact.schema";

export interface GetContactDto {
	userId: string;
	contactPid: string;
}

export interface PublicContact {
	pid: string;
	name: string;
	email: string;
	phone: string;
	data: {
		notes?: string;
	} & Record<string, unknown>;
	provider: ContactProvider;
	createdAt: Date;
	updatedAt: Date;
}

export type GetContactResponseDto = PublicContact;
