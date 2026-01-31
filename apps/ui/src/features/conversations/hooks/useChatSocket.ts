import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";

type ChatWS = Awaited<ReturnType<typeof api.livechat.subscribe>>;
type WSSubscribeCallback = Parameters<ChatWS["subscribe"]>[0];
type WSEvent = Parameters<WSSubscribeCallback>[0];
type WSData = WSEvent extends { data: infer D } ? D : never;
export type WSSendPayload = Parameters<ChatWS["send"]>[0];

interface UseChatSocketProps {
	onMessageReceived: (message: WSData) => void;
	onConnect: () => void;
}

export function useChatSocket({
	onMessageReceived,
	onConnect,
}: UseChatSocketProps) {
	const socketRef = useRef<ChatWS | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const connectRef = useRef<() => Promise<void>>(null);
	const onMessageReceivedRef = useRef(onMessageReceived);
	const onConnectRef = useRef(onConnect);

	useEffect(() => {
		onMessageReceivedRef.current = onMessageReceived;
	}, [onMessageReceived]);

	useEffect(() => {
		onConnectRef.current = onConnect;
	}, [onConnect]);

	const scheduleReconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) return;

		console.log("Attempting to reconnect in 3s...");
		reconnectTimeoutRef.current = setTimeout(() => {
			reconnectTimeoutRef.current = null;
			connectRef.current?.();
		}, 3000);
	}, []);

	const connect = useCallback(async () => {
		if (socketRef.current) return;

		try {
			const ws = await api.livechat.subscribe();

			if (ws) {
				socketRef.current = ws;

				ws.subscribe((event) => {
					onMessageReceivedRef.current(event.data);
				});

				ws.on("open", () => {
					console.log("Connected to Chat WS");
					if (reconnectTimeoutRef.current) {
						clearTimeout(reconnectTimeoutRef.current);
						reconnectTimeoutRef.current = null;
					}
					onConnectRef.current();
				});

				ws.on("close", () => {
					console.log("Disconnected from Chat WS");
					socketRef.current = null;
					scheduleReconnect();
				});

				ws.on("error", (error) => {
					console.error("Chat WS Error:", error);
				});
			} else {
				scheduleReconnect();
			}
		} catch (error) {
			console.error("Failed to connect to Chat WS:", error);
			scheduleReconnect();
		}
	}, [scheduleReconnect]);

	useEffect(() => {
		connectRef.current = connect;
	}, [connect]);

	useEffect(() => {
		connect();

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connect]);

	const send = useCallback((payload: WSSendPayload) => {
		if (socketRef.current) {
			socketRef.current.send(payload);
		} else {
			console.warn("Socket not connected");
		}
	}, []);

	return {
		send,
	};
}
