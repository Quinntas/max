import { ContactRepo } from "../../repo/contact.repo";
import { CreateContactCommand } from "./createContact.command";

export const createContactCommand = new CreateContactCommand(
	ContactRepo.createContact,
);
