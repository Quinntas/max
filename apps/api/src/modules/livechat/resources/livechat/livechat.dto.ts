import { t } from "elysia";
import type { ElysiaWS } from "elysia/ws";
import type { UserSelectModel } from "../../../auth/repo/auth.schema";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import { ConversationStatus } from "../../../conversation/repo/conversation.schema";
import {
	MessageContentType,
	MesssageSenderType,
} from "../../../message/repo/message.schema";

export const LiveChatBody = t.Union([
	t.Object({
		type: t.Literal("GET_CONVERSATIONS"),
		payload: t.Object({
			limit: t.Number(),
			offset: t.Number(),
			search: t.Optional(t.Enum(ConversationStatus)),
			sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
		}),
	}),
	t.Object({
		type: t.Literal("GET_MESSAGES"),
		payload: t.Object({
			conversationPid: t.String(),
			limit: t.Number(),
			offset: t.Number(),
			sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
		}),
	}),
	t.Object({
		type: t.Literal("SEND_MESSAGE"),
		payload: t.Object({
			content: t.String(),
			contentType: t.Enum(MessageContentType),
			conversationPid: t.String(),
			senderType: t.Enum(MesssageSenderType),
		}),
	}),
	t.Object({
		type: t.Literal("START_TYPING"),
		payload: t.Object({
			conversationPid: t.String(),
		}),
	}),
	t.Object({
		type: t.Literal("STOP_TYPING"),
		payload: t.Object({
			conversationPid: t.String(),
		}),
	}),
]);

export type LiveChatBodyType = typeof LiveChatBody.static;

export const LiveChatResponse = t.Union([
	t.Object({
		type: t.Literal("GET_CONVERSATIONS"),
		payload: t.Object({
			data: t.Array(
				t.Object({
					conversation: t.Object({
						pid: t.String(),
						status: t.Enum(ConversationStatus),
						lastMessageAt: t.Union([t.Date(), t.String(), t.Null()]),
						createdAt: t.Union([t.Date(), t.String()]),
						updatedAt: t.Union([t.Date(), t.String()]),
					}),
					user: t.Object({
						id: t.String(),
						name: t.String(),
						email: t.String(),
						image: t.Nullable(t.String()),
					}),
					contact: t.Object({
						pid: t.String(),
						name: t.String(),
						email: t.String(),
						phone: t.String(),
						data: t.Object(
							{
								notes: t.Optional(t.String()),
							},
							{ additionalProperties: true },
						),
						provider: t.Enum(ContactProvider),
					}),
				}),
			),
			pagination: t.Object({
				total: t.Number(),
				isMore: t.Boolean(),
				nextOffset: t.Nullable(t.Number()),
			}),
		}),
	}),
	t.Object({
		type: t.Literal("GET_MESSAGES"),
		payload: t.Object({
			data: t.Array(
				t.Object({
					pid: t.String(),
					senderType: t.Enum(MesssageSenderType),
					content: t.String(),
					contentType: t.Enum(MessageContentType),
					createdAt: t.Union([t.Date(), t.String()]),
					updatedAt: t.Union([t.Date(), t.String()]),
				}),
			),
			pagination: t.Object({
				total: t.Number(),
				isMore: t.Boolean(),
				nextOffset: t.Nullable(t.Number()),
			}),
		}),
	}),
	t.Object({
		type: t.Literal("NEW_MESSAGE"),
		payload: t.Object({
			pid: t.String(),
			senderType: t.Enum(MesssageSenderType),
			content: t.String(),
			contentType: t.Enum(MessageContentType),
			conversationPid: t.String(),
			createdAt: t.Union([t.Date(), t.String()]),
			updatedAt: t.Union([t.Date(), t.String()]),
		}),
	}),
	t.Object({
		type: t.Literal("ERROR"),
		payload: t.Object({
			message: t.String(),
			code: t.Optional(t.String()),
		}),
	}),
]);

export type LiveChatResponseType = typeof LiveChatResponse.static;

export type ContextUser =
	| UserSelectModel
	| (Omit<UserSelectModel, "image"> & { image?: string | null });

export type LiveChatDto = {
	ws: ElysiaWS<
		{
			user: ContextUser;
		},
		{
			body: LiveChatBodyType;
		}
	>;
	user: ContextUser;
};

export type LiveChatResponseDto = void;
