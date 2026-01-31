import { Elysia, t } from "elysia";
import { rebaseContactsCommand } from "../../modules/hubspot/resources/rebaseContacts";
import { authPlugin } from "../plugins/auth.plugin";

export const hubspotRoutes = new Elysia({ prefix: "/hubspot" })
	.use(authPlugin)
	.guard({ auth: true }, (app) =>
		app.post(
			"/rebase",
			async ({ user }) => {
				await rebaseContactsCommand.instrumentedHandle({
					userId: user.id,
				});

				return { message: "ok" };
			},
			{
				detail: {
					tags: ["HubSpot"],
					summary: "Rebase contacts from HubSpot",
				},
				response: t.Object({
					message: t.String(),
				}),
			},
		),
	);
