import { Elysia } from "elysia";
import { liveChatCommand } from "../../modules/livechat/resources/livechat";
import {
	LiveChatBody,
	type LiveChatBodyType,
	LiveChatResponse,
} from "../../modules/livechat/resources/livechat/livechat.dto";
import { logger } from "../logger";
import { authPlugin } from "../plugins/auth.plugin";

export const livechatRoutes = new Elysia().use(authPlugin).ws("/livechat", {
	auth: true,
	body: LiveChatBody,
	response: LiveChatResponse,
	async open(ws) {
		try {
			await liveChatCommand.instrumentedHandle({
				ws,
				user: ws.data.user,
			});
		} catch (error) {
			logger.error({ error }, "WebSocket open handler error");
		}
	},
	async message(ws, message) {
		try {
			await liveChatCommand.onMessage(
				ws.data.user,
				ws,
				message as LiveChatBodyType,
			);
		} catch (error) {
			logger.error({ error }, "WebSocket message handler error");
			ws.send({
				type: "ERROR",
				payload: {
					message:
						error instanceof Error
							? error.message
							: "An unexpected error occurred",
					code: "MESSAGE_HANDLER_ERROR",
				},
			});
		}
	},
	async close(ws) {
		await liveChatCommand.onClose(ws.data.user, ws);
	},
	detail: {
		tags: ["Livechat"],
		summary: "Connects to the livechat websocket",
	},
});
