import { Elysia, status, t } from "elysia";
import { createContactCommand } from "../../modules/contact/resources/createContact";
import { deleteContactCommand } from "../../modules/contact/resources/deleteContact";
import { getContactCommand } from "../../modules/contact/resources/getContact";
import { getContactsCommand } from "../../modules/contact/resources/getContacts";
import { updateContactCommand } from "../../modules/contact/resources/updateContact";
import { authPlugin } from "../plugins/auth.plugin";
import { ContactProvider } from "../schema";

export const contactsRoutes = new Elysia({ prefix: "/contacts" })
	.use(authPlugin)
	.guard({ auth: true }, (app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const result = await getContactsCommand.instrumentedHandle({
						userId: user.id,
						limit: query.limit,
						offset: query.offset,
						search: query.search,
						provider: query.provider,
						sort: query.sort,
					});

					return result;
				},
				{
					detail: {
						tags: ["Contacts"],
						summary: "List contacts",
					},
					query: t.Object({
						limit: t.Number({ default: 30 }),
						offset: t.Number({ default: 0 }),
						search: t.Optional(t.String()),
						provider: t.Optional(t.Enum(ContactProvider)),
						sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
					}),
				},
			)
			.get(
				"/:pid",
				async ({ params, user }) => {
					const result = await getContactCommand.instrumentedHandle({
						userId: user.id,
						contactPid: params.pid,
					});

					return result;
				},
				{
					detail: {
						tags: ["Contacts"],
						summary: "Get a contact by PID",
					},
					params: t.Object({
						pid: t.String(),
					}),
				},
			)
			.post(
				"/",
				async ({ body, user }) => {
					const result = await createContactCommand.instrumentedHandle({
						userId: user.id,
						name: body.name,
						email: body.email,
						phone: body.phone,
						provider: body.provider,
						data: body.data,
					});

					return status(201, result);
				},
				{
					detail: {
						tags: ["Contacts"],
						summary: "Create a new contact",
					},
					body: t.Object({
						name: t.String(),
						email: t.String(),
						phone: t.String(),
						provider: t.Enum(ContactProvider),
						data: t.Optional(
							t.Object({
								notes: t.Optional(t.String()),
							}),
						),
					}),
				},
			)
			.patch(
				"/:pid",
				async ({ params, body, user }) => {
					const result = await updateContactCommand.instrumentedHandle({
						userId: user.id,
						contactPid: params.pid,
						name: body.name,
						email: body.email,
						phone: body.phone,
						data: body.data,
					});

					return result;
				},
				{
					detail: {
						tags: ["Contacts"],
						summary: "Update a contact",
					},
					params: t.Object({
						pid: t.String(),
					}),
					body: t.Object({
						name: t.Optional(t.String()),
						email: t.Optional(t.String()),
						phone: t.Optional(t.String()),
						data: t.Optional(
							t.Object({
								notes: t.Optional(t.String()),
							}),
						),
					}),
				},
			)
			.delete(
				"/:pid",
				async ({ params, user }) => {
					const result = await deleteContactCommand.instrumentedHandle({
						userId: user.id,
						contactPid: params.pid,
					});

					return result;
				},
				{
					detail: {
						tags: ["Contacts"],
						summary: "Delete a contact",
					},
					params: t.Object({
						pid: t.String(),
					}),
				},
			),
	);
