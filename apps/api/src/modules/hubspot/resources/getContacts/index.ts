import { env } from "../../../../utils/env";
import { GetContactsCommand } from "./getContacts.command";

export const getContactsCommand = new GetContactsCommand(
	env.HUBSPOT_ACCESS_TOKEN,
);
