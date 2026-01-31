import type { ContactInsertModel } from "../../repo/contact.schema";

export interface UpsertContactsDto {
	userId: string;
	contact: Array<
		(Partial<ContactInsertModel> | ContactInsertModel) & {
			pid: string;
		}
	>;
}

export type UpsertContactsResponseDto = void;
