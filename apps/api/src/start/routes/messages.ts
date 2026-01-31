import { Elysia, status, t } from "elysia";
import { createMessageCommand } from "../../modules/message/resources/createMessage";
import { authPlugin } from "../plugins/auth.plugin";
import { MessageContentType, MesssageSenderType } from "../schema";

export const messagesRoutes = new Elysia({ prefix: "/messages" })
	.use(authPlugin)
	.post(
		"/",
		async ({ body, user }) => {
			await createMessageCommand.instrumentedHandle({
				...body,
				userId: user.id,
			});

			return status(201, {
				message: "Message created successfully",
			});
		},
		{
			auth: true,
			detail: {
				tags: ["Messages"],
				summary: "Create a new message",
			},
			body: t.Object({
				content: t.String(),
				contentType: t.Enum(MessageContentType),
				conversationPid: t.String(),
				senderType: t.Enum(MesssageSenderType),
			}),
			response: {
				201: t.Object({
					message: t.String(),
				}),
			},
		},
	);
