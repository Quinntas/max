import { ContactRepo } from "../../repo/contact.repo";
import { GetContactCommand } from "./getContact.command";

export const getContactCommand = new GetContactCommand(
	ContactRepo.getContactByPidAndUserId,
);
