import type { ElysiaWS } from "elysia/ws";
import type { LivechatSendProtocol } from "../modules/livechat/core/protocol";
import type { ContextUser } from "../modules/livechat/resources/livechat/livechat.dto";

type SocketEntry = {
	ws: ElysiaWS;
	onSendMessage?: (payload: LivechatSendProtocol) => void | Promise<void>;
	user: ContextUser;
};

export class WSContainer {
	private _sockets: Map<string, SocketEntry[]>;
	private _socketToUser: Map<string, string>;

	constructor() {
		this._sockets = new Map();
		this._socketToUser = new Map();
	}

	add(
		user: ContextUser,
		ws: ElysiaWS,
		onSendMessage?: (payload: LivechatSendProtocol) => void | Promise<void>,
	) {
		const entry: SocketEntry = {
			ws,
			onSendMessage,
			user,
		};

		if (!this._sockets.has(user.id)) {
			this._sockets.set(user.id, []);
		}

		this._sockets.get(user.id)?.push(entry);
		this._socketToUser.set(ws.id, user.id);
	}

	remove(socketId: string) {
		const userId = this._socketToUser.get(socketId);
		if (!userId) return;

		const userSockets = this._sockets.get(userId);
		if (userSockets) {
			const index = userSockets.findIndex((s) => s.ws.id === socketId);
			if (index !== -1) {
				userSockets.splice(index, 1);
			}

			if (userSockets.length === 0) {
				this._sockets.delete(userId);
			}
		}

		this._socketToUser.delete(socketId);
	}

	get(userId: string) {
		return this._sockets.get(userId) || [];
	}

	async send(userId: string, payload: LivechatSendProtocol) {
		const sockets = this.get(userId);
		for (const socket of sockets) {
			socket.ws.send(payload);
			await socket.onSendMessage?.(payload);
		}
	}
}
