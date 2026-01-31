import { ContactRepo } from "../../repo/contact.repo";
import { GetContactsCommand } from "./getContacts.command";

export const getContactsCommand = new GetContactsCommand(
	ContactRepo.getContacts,
	ContactRepo.countContacts,
);
