import { ContactRepo } from "../../repo/contact.repo";
import { UpdateContactCommand } from "./updateContact.command";

export const updateContactCommand = new UpdateContactCommand(
	ContactRepo.getContactByPidAndUserId,
	ContactRepo.updateContactByPidAndUserId,
);
