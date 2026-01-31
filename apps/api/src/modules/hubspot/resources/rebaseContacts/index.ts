import { ContactRepo } from "../../../contact/repo/contact.repo";
import { upsertContactCommand } from "../../../contact/resources/upsertContacts";
import { getContactsCommand } from "../getContacts";
import { RebaseContactsCommand } from "./rebaseContacts.command";

export const rebaseContactsCommand = new RebaseContactsCommand(
	getContactsCommand,
	upsertContactCommand,
	ContactRepo.getContactIdentifiersByUserId,
);
