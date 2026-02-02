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
	requestAiSuggestion: () => void;
	dismissAiSuggestion: () => void;
	aiSuggestions: string[];
	isLoadingAiSuggestion: boolean;
	unseenCounts: Record<string, number>;
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
	const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
	const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);
	const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>({});

	const messageOffsetRef = useRef(0);
	const conversationOffsetRef = useRef(0);
	const isLoadingMoreMessagesRef = useRef(false);
	const isLoadingMoreConversationsRef = useRef(false);
	const selectedConversationPidRef = useRef<string | null>(null);
	const seenMessagePidsRef = useRef<Set<string>>(new Set());
	const pendingConversationRefreshRef = useRef(false);

	selectedConversationPidRef.current = selectedConversationPid;

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

					if (pendingConversationRefreshRef.current) {
						pendingConversationRefreshRef.current = false;
						setConversations((prev) => {
							const existingPids = new Set(prev.map((c) => c.conversation.pid));
							const toAdd = newConversations.filter(
								(c) => !existingPids.has(c.conversation.pid),
							);
							return [...toAdd, ...prev];
						});
						setIsLoadingConversations(false);
						break;
					}

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
					const newMessage = data.payload;
					const messageConversationPid = newMessage.conversationPid;

					if (seenMessagePidsRef.current.has(newMessage.pid)) {
						break;
					}
					seenMessagePidsRef.current.add(newMessage.pid);

					setConversations((prev) => {
						const conversationExists = prev.some(
							(conv) => conv.conversation.pid === messageConversationPid,
						);

						if (!conversationExists && !pendingConversationRefreshRef.current) {
							pendingConversationRefreshRef.current = true;
							send({
								type: "GET_CONVERSATIONS",
								payload: {
									limit: CONVERSATIONS_PER_PAGE,
									offset: 0,
								},
							});
							return prev;
						}

						return prev.map((conv) => {
							if (conv.conversation.pid === messageConversationPid) {
								return {
									...conv,
									conversation: {
										...conv.conversation,
										lastMessageAt: newMessage.createdAt,
									},
									lastMessage: {
										pid: newMessage.pid,
										senderType: newMessage.senderType,
										content: newMessage.content,
										contentType: newMessage.contentType,
										createdAt: newMessage.createdAt,
										updatedAt: newMessage.updatedAt,
									},
								};
							}
							return conv;
						});
					});

					if (messageConversationPid === selectedConversationPidRef.current) {
						setMessages((prev) => {
							const exists = prev.some((msg) => msg.pid === newMessage.pid);
							if (exists) return prev;
							return [...prev, newMessage];
						});
					} else {
						setUnseenCounts((prev) => ({
							...prev,
							[messageConversationPid]: (prev[messageConversationPid] || 0) + 1,
						}));
					}
					break;
				}
				case "AI_SUGGESTION": {
					setAiSuggestions(data.payload.messages);
					setIsLoadingAiSuggestion(false);
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
					setIsLoadingAiSuggestion(false);
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
			setAiSuggestions([]);
			isLoadingMoreMessagesRef.current = false;

			setUnseenCounts((prev) => {
				if (prev[selectedConversationPid]) {
					const { [selectedConversationPid]: _, ...rest } = prev;
					return rest;
				}
				return prev;
			});

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
			setAiSuggestions([]);
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
		if (!content.trim()) return;

		send({
			type: "SEND_MESSAGE",
			payload: {
				content: content.trim(),
				contentType: "TEXT",
				conversationPid: selectedConversationPid,
				senderType: "HUMAN_AGENT",
			},
		} as WSSendPayload);
	};

	const requestAiSuggestion = useCallback(() => {
		if (!selectedConversationPid || isLoadingAiSuggestion) return;

		setIsLoadingAiSuggestion(true);
		setAiSuggestions([]);

		send({
			type: "READY_FOR_AI_SUGGESTION",
			payload: {
				conversationPid: selectedConversationPid,
			},
		} as WSSendPayload);
	}, [selectedConversationPid, isLoadingAiSuggestion, send]);

	const dismissAiSuggestion = useCallback(() => {
		setAiSuggestions([]);
		setIsLoadingAiSuggestion(false);
	}, []);

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
		requestAiSuggestion,
		dismissAiSuggestion,
		aiSuggestions,
		isLoadingAiSuggestion,
		unseenCounts,
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
