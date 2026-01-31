import { Elysia, status, t } from "elysia";
import { createConversationCommand } from "../../modules/conversation/resources/createConversation";
import { deleteConversationCommand } from "../../modules/conversation/resources/deleteConversation";
import { getConversationCommand } from "../../modules/conversation/resources/getConversation";
import { getConversationsCommand } from "../../modules/conversation/resources/getConversations";
import { updateConversationCommand } from "../../modules/conversation/resources/updateConversation";
import { authPlugin } from "../plugins/auth.plugin";
import { ConversationStatus } from "../schema";

export const conversationsRoutes = new Elysia({
	prefix: "/conversations",
})
	.use(authPlugin)
	.guard({ auth: true }, (app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const result = await getConversationsCommand.instrumentedHandle({
						userId: user.id,
						limit: query.limit,
						offset: query.offset,
						status: query.status,
						sort: query.sort,
					});

					return result;
				},
				{
					detail: {
						tags: ["Conversations"],
						summary: "List conversations",
					},
					query: t.Object({
						limit: t.Number({ default: 30 }),
						offset: t.Number({ default: 0 }),
						status: t.Optional(t.Enum(ConversationStatus)),
						sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
					}),
				},
			)
			.get(
				"/:pid",
				async ({ params, user }) => {
					const result = await getConversationCommand.instrumentedHandle({
						userId: user.id,
						conversationPid: params.pid,
					});

					return result;
				},
				{
					detail: {
						tags: ["Conversations"],
						summary: "Get a conversation by PID",
					},
					params: t.Object({
						pid: t.String(),
					}),
				},
			)
			.post(
				"/",
				async ({ body, user }) => {
					const result = await createConversationCommand.instrumentedHandle({
						userId: user.id,
						contactPid: body.contactPid,
						status: body.status,
					});

					return status(201, result);
				},
				{
					detail: {
						tags: ["Conversations"],
						summary: "Create a new conversation",
					},
					body: t.Object({
						contactPid: t.String(),
						status: t.Optional(t.Enum(ConversationStatus)),
					}),
				},
			)
			.patch(
				"/:pid",
        async ({ params, body, user }) => {
					const result = await updateConversationCommand.instrumentedHandle({
						userId: user.id,
						conversationPid: params.pid,
						status: body.status,
					});

					return result;
				},
				{
					detail: {
						tags: ["Conversations"],
						summary: "Update a conversation",
					},
					params: t.Object({
						pid: t.String(),
					}),
					body: t.Object({
						status: t.Optional(t.Enum(ConversationStatus)),
					}),
				},
			)
			.delete(
				"/:pid",
				async ({ params, user }) => {
					const result = await deleteConversationCommand.instrumentedHandle({
						userId: user.id,
						conversationPid: params.pid,
					});

					return result;
				},
				{
					detail: {
						tags: ["Conversations"],
						summary: "Delete a conversation",
					},
					params: t.Object({
						pid: t.String(),
					}),
				},
			),
	);
