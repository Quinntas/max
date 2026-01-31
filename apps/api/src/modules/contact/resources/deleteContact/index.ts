import { ContactRepo } from "../../repo/contact.repo";
import { DeleteContactCommand } from "./deleteContact.command";

export const deleteContactCommand = new DeleteContactCommand(
	ContactRepo.getContactByPidAndUserId,
	ContactRepo.deleteContact,
);
