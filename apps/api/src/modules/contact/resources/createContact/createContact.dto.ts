import type {
	ContactProvider,
	ContactSelectModel,
} from "../../repo/contact.schema";

export interface CreateContactDto {
	userId: string;
	name: string;
	email: string;
	phone: string;
	provider: ContactProvider;
	data?: {
		notes?: string;
	};
}

export type CreateContactResponseDto = ContactSelectModel;
