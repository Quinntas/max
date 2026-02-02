import type { ContactSelectModel } from "../../contact/repo/contact.schema";

export interface CRMAdapter {
	pushContact(contact: ContactSelectModel): Promise<string>;
	updateContact(crmId: string, updates: Partial<ContactSelectModel>): Promise<void>;
}
