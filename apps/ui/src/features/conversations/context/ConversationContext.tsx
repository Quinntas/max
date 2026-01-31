import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useChatSocket, type WSSendPayload } from "../hooks/useChatSocket";
import type { Conversation, Message } from "../types";

const MESSAGES_PER_PAGE = 50;
const CONVERSATIONS_PER_PAGE = 30;

export interface ConversationContextType {
	conversations: Conversation[];
	setConversations: Dispatch<SetStateAction<Conversation[]>>;
	messages: Message[];
	selectedConversationPid: string | null;
	setSelectedConversationPid: (pid: string | null) => void;
	selectedConversation: Conversation | undefined;
	sendMessage: (content: string) => void;
	loadMoreMessages: () => void;
	hasMoreMessages: boolean;
	isLoadingMessages: boolean;
	loadMoreConversations: () => void;
	hasMoreConversations: boolean;
	isLoadingConversations: boolean;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
	undefined,
);

export function ConversationProvider({ children }: { children: ReactNode }) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedConversationPid, setSelectedConversationPid] = useState<
		string | null
	>(null);
	const [hasMoreMessages, setHasMoreMessages] = useState(false);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [hasMoreConversations, setHasMoreConversations] = useState(false);
	const [isLoadingConversations, setIsLoadingConversations] = useState(false);

	const messageOffsetRef = useRef(0);
	const conversationOffsetRef = useRef(0);
	const isLoadingMoreMessagesRef = useRef(false);
	const isLoadingMoreConversationsRef = useRef(false);

	const { send } = useChatSocket({
		onConnect: () => {
			setIsLoadingConversations(true);
			send({
				type: "GET_CONVERSATIONS",
				payload: {
					limit: CONVERSATIONS_PER_PAGE,
					offset: 0,
				},
			});
		},
		onMessageReceived: (data) => {
			switch (data.type) {
				case "GET_CONVERSATIONS": {
					const newConversations = data.payload.data;
					const pagination = data.payload.pagination;

					if (isLoadingMoreConversationsRef.current) {
						setConversations((prev) => [...prev, ...newConversations]);
						isLoadingMoreConversationsRef.current = false;
					} else {
						setConversations(newConversations);
					}

					setHasMoreConversations(pagination.isMore);
					conversationOffsetRef.current += newConversations.length;
					setIsLoadingConversations(false);
					break;
				}
				case "GET_MESSAGES": {
					const newMessages = data.payload.data;
					const pagination = data.payload.pagination;

					if (isLoadingMoreMessagesRef.current) {
						setMessages((prev) => [...newMessages, ...prev]);
						isLoadingMoreMessagesRef.current = false;
					} else {
						setMessages(newMessages.reverse());
					}

					setHasMoreMessages(pagination.isMore);
					messageOffsetRef.current += newMessages.length;
					setIsLoadingMessages(false);
					break;
				}
				case "NEW_MESSAGE": {
					setMessages((prev) => {
						// Prevent duplicates by checking if message already exists
						const exists = prev.some((msg) => msg.pid === data.payload.pid);
						if (exists) return prev;
						return [...prev, data.payload];
					});
					break;
				}
				case "ERROR": {
					console.error(
						"[WebSocket Error]",
						data.payload.message,
						data.payload.code,
					);
					setIsLoadingMessages(false);
					setIsLoadingConversations(false);
					isLoadingMoreMessagesRef.current = false;
					isLoadingMoreConversationsRef.current = false;
					break;
				}
			}
		},
	});

	useEffect(() => {
		if (selectedConversationPid) {
			messageOffsetRef.current = 0;
			setMessages([]);
			setHasMoreMessages(false);
			setIsLoadingMessages(true);
			isLoadingMoreMessagesRef.current = false;

			send({
				type: "GET_MESSAGES",
				payload: {
					conversationPid: selectedConversationPid,
					limit: MESSAGES_PER_PAGE,
					offset: 0,
					sort: "desc",
				},
			} as WSSendPayload);
		} else {
			setMessages([]);
			setHasMoreMessages(false);
			messageOffsetRef.current = 0;
		}
	}, [selectedConversationPid, send]);

	const loadMoreMessages = useCallback(() => {
		if (
			!selectedConversationPid ||
			isLoadingMessages ||
			!hasMoreMessages ||
			isLoadingMoreMessagesRef.current
		) {
			return;
		}

		isLoadingMoreMessagesRef.current = true;
		setIsLoadingMessages(true);

		send({
			type: "GET_MESSAGES",
			payload: {
				conversationPid: selectedConversationPid,
				limit: MESSAGES_PER_PAGE,
				offset: messageOffsetRef.current,
				sort: "desc",
			},
		} as WSSendPayload);
	}, [selectedConversationPid, isLoadingMessages, hasMoreMessages, send]);

	const loadMoreConversations = useCallback(() => {
		if (
			isLoadingConversations ||
			!hasMoreConversations ||
			isLoadingMoreConversationsRef.current
		) {
			return;
		}

		isLoadingMoreConversationsRef.current = true;
		setIsLoadingConversations(true);

		send({
			type: "GET_CONVERSATIONS",
			payload: {
				limit: CONVERSATIONS_PER_PAGE,
				offset: conversationOffsetRef.current,
			},
		});
	}, [isLoadingConversations, hasMoreConversations, send]);

	const selectedConversation = conversations.find(
		(c) => c.conversation.pid === selectedConversationPid,
	);

	const sendMessage = (content: string) => {
		if (!selectedConversationPid) return;

		send({
			type: "SEND_MESSAGE",
			payload: {
				content,
				contentType: "TEXT",
				conversationPid: selectedConversationPid,
				senderType: "HUMAN_AGENT",
			},
		} as WSSendPayload);
	};

	const value = {
		conversations,
		setConversations,
		messages,
		selectedConversationPid,
		setSelectedConversationPid,
		selectedConversation,
		sendMessage,
		loadMoreMessages,
		hasMoreMessages,
		isLoadingMessages,
		loadMoreConversations,
		hasMoreConversations,
		isLoadingConversations,
	};

	return (
		<ConversationContext.Provider value={value}>
			{children}
		</ConversationContext.Provider>
	);
}

export function useConversationContext() {
	const context = useContext(ConversationContext);
	if (context === undefined) {
		throw new Error(
			"useConversationContext must be used within a ConversationProvider",
		);
	}
	return context;
}
