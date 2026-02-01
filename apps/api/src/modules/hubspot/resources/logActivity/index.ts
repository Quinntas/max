import { env } from "../../../../utils/env";
import { LogActivityCommand } from "./logActivity.command";

export const logActivityCommand = new LogActivityCommand(
	env.HUBSPOT_ACCESS_TOKEN,
);
