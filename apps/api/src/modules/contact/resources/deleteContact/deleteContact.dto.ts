import type { ContactSelectModel } from "../../repo/contact.schema";

export interface DeleteContactDto {
	userId: string;
	contactPid: string;
}

export type DeleteContactResponseDto = ContactSelectModel;
