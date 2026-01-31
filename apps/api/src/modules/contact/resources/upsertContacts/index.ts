import { ContactRepo } from "../../repo/contact.repo";
import { UpsertContactsCommand } from "./upsertContacts.command";

export const upsertContactCommand = new UpsertContactsCommand(
	ContactRepo.getContactByPidAndUserId,
	ContactRepo.updateContact,
	ContactRepo.createContact,
);
