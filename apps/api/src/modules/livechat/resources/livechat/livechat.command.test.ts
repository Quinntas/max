import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WSContainer } from "../../../../infra/wsContainer";
import type { TextSuggestionCommand } from "../../../ai/resources/textSuggestion/textSuggestion.command";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import { ConversationStatus } from "../../../conversation/repo/conversation.schema";
import type { GetConversationsCommand } from "../../../conversation/resources/getConversations/getConversations.command";
import type { GetConversationsResponseDto } from "../../../conversation/resources/getConversations/getConversations.dto";
import type { LogActivityCommand } from "../../../hubspot/resources/logActivity/logActivity.command";
import {
	MessageContentType,
	MesssageSenderType,
} from "../../../message/repo/message.schema";
import type { CreateMessageCommand } from "../../../message/resources/createMessage/createMessage.command";
import type { GetMessagesCommand } from "../../../message/resources/getMessages/getMessages.command";
import {
	LivechatReceiveProtocolType,
	LivechatSendProtocolType,
} from "../../core/protocol";
import { LiveChatCommand } from "./livechat.command";
import type { ContextUser, LiveChatDto } from "./livechat.dto";

vi.mock("../../../message/repo/message.repo", () => ({
	MessageRepo: {
		getAllMessages: vi.fn(),
	},
}));

const { MessageRepo } = await import("../../../message/repo/message.repo");

describe("LiveChatCommand", () => {
	let liveChatCommand: LiveChatCommand;
	let mockWsContainer: WSContainer;
	let mockGetConversationsCommand: GetConversationsCommand;
	let mockCreateMessageCommand: CreateMessageCommand;
	let mockGetMessagesCommand: GetMessagesCommand;
	let mockTextSuggestionCommand: TextSuggestionCommand;
	let mockLogActivityCommand: LogActivityCommand;
	let mockWs: LiveChatDto["ws"];
	let mockUser: ContextUser;

	beforeEach(() => {
		vi.clearAllMocks();

		mockWsContainer = {
			add: vi.fn(),
			remove: vi.fn(),
			get: vi.fn(),
			send: vi.fn(),
		} as unknown as WSContainer;

		mockGetConversationsCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as GetConversationsCommand;

		mockCreateMessageCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as CreateMessageCommand;

		mockGetMessagesCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as GetMessagesCommand;

		mockTextSuggestionCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as TextSuggestionCommand;

		mockLogActivityCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as LogActivityCommand;

		mockWs = {
			id: "ws-123",
			send: vi.fn(),
		} as unknown as LiveChatDto["ws"];

		mockUser = {
			id: "user-123",
			name: "Test User",
			email: "test@example.com",
			emailVerified: true,
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		liveChatCommand = new LiveChatCommand(
			mockWsContainer,
			mockGetConversationsCommand,
			mockCreateMessageCommand,
			mockGetMessagesCommand,
			mockTextSuggestionCommand,
			mockLogActivityCommand,
		);
	});

	describe("handle", () => {
		it("should add websocket to container", async () => {
			const dto: LiveChatDto = {
				ws: mockWs,
				user: mockUser,
			};

			await liveChatCommand.handle(dto);

			expect(mockWsContainer.add).toHaveBeenCalledWith(mockUser, mockWs);
		});
	});

	describe("onClose", () => {
		it("should remove websocket from container", async () => {
			await liveChatCommand.onClose(mockUser, mockWs);

			expect(mockWsContainer.remove).toHaveBeenCalledWith("ws-123");
		});
	});

	describe("onMessage", () => {
		describe("SEND_MESSAGE", () => {
			it("should call createMessageCommand with payload and userId", async () => {
				const message = {
					type: LivechatReceiveProtocolType.SEND_MESSAGE as const,
					payload: {
						content: "Hello world",
						contentType: MessageContentType.TEXT,
						conversationPid: "conv-123",
						senderType: MesssageSenderType.HUMAN_AGENT,
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenCalledWith({
					content: "Hello world",
					contentType: MessageContentType.TEXT,
					conversationPid: "conv-123",
					senderType: MesssageSenderType.HUMAN_AGENT,
					userId: "user-123",
				});
			});
		});

		describe("GET_MESSAGES", () => {
			it("should fetch messages and send response via websocket", async () => {
				const messagesResponse = {
					data: [
						{
							pid: "msg-1",
							senderType: MesssageSenderType.COSTUMER,
							content: "Hi there",
							contentType: MessageContentType.TEXT,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					],
					pagination: {
						total: 1,
						isMore: false,
						nextOffset: null,
					},
				};

				vi.mocked(mockGetMessagesCommand.instrumentedHandle).mockResolvedValue(
					messagesResponse,
				);

				const message = {
					type: LivechatReceiveProtocolType.GET_MESSAGES as const,
					payload: {
						conversationPid: "conv-123",
						limit: 50,
						offset: 0,
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(mockGetMessagesCommand.instrumentedHandle).toHaveBeenCalledWith({
					conversationPid: "conv-123",
					limit: 50,
					offset: 0,
					userId: "user-123",
				});

				expect(mockWs.send).toHaveBeenCalledWith({
					type: LivechatSendProtocolType.GET_MESSAGES,
					payload: messagesResponse,
				});
			});
		});

		describe("GET_CONVERSATIONS", () => {
			it("should fetch conversations and send response via websocket", async () => {
				const conversationsResponse: GetConversationsResponseDto = {
					data: [
						{
							conversation: {
								pid: "conv-123",
								status: ConversationStatus.NEW,
								lastMessageAt: new Date(),
								createdAt: new Date(),
								updatedAt: new Date(),
							},
							user: {
								id: "user-123",
								name: "Test User",
								email: "test@example.com",
								image: null,
							},
							contact: {
								pid: "contact-123",
								name: "John Doe",
								email: "john@example.com",
								phone: "+1234567890",
								data: {},
								provider: ContactProvider.HUBSPOT,
							},
							lastMessage: null,
						},
					],
					pagination: {
						total: 1,
						isMore: false,
						nextOffset: null,
					},
				};

				vi.mocked(mockGetConversationsCommand.instrumentedHandle).mockResolvedValue(
					conversationsResponse,
				);

				const message = {
					type: LivechatReceiveProtocolType.GET_CONVERSATIONS as const,
					payload: {
						limit: 20,
						offset: 0,
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(mockGetConversationsCommand.instrumentedHandle).toHaveBeenCalledWith({
					limit: 20,
					offset: 0,
					userId: "user-123",
				});

				expect(mockWs.send).toHaveBeenCalledWith({
					type: LivechatSendProtocolType.GET_CONVERSATIONS,
					payload: conversationsResponse,
				});
			});

			it("should pass search and sort parameters", async () => {
				const conversationsResponse = {
					data: [],
					pagination: {
						total: 0,
						isMore: false,
						nextOffset: null,
					},
				};

				vi.mocked(mockGetConversationsCommand.instrumentedHandle).mockResolvedValue(
					conversationsResponse,
				);

				const message = {
					type: LivechatReceiveProtocolType.GET_CONVERSATIONS as const,
					payload: {
						limit: 10,
						offset: 5,
						search: ConversationStatus.IN_PROGRESS,
						sort: "desc" as const,
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(mockGetConversationsCommand.instrumentedHandle).toHaveBeenCalledWith({
					limit: 10,
					offset: 5,
					search: ConversationStatus.IN_PROGRESS,
					sort: "desc",
					userId: "user-123",
				});
			});
		});

		describe("READY_FOR_AI_SUGGESTION", () => {
			it("should fetch messages, generate suggestion, and send response", async () => {
				const mockMessages = [
					{
						senderType: MesssageSenderType.COSTUMER,
						content: "I need help with my car",
						contentType: MessageContentType.TEXT,
						createdAt: new Date(),
					},
					{
						senderType: MesssageSenderType.HUMAN_AGENT,
						content: "Of course! What seems to be the issue?",
						contentType: MessageContentType.TEXT,
						createdAt: new Date(),
					},
				];

				const suggestionResponse = {
					messages: [
						"I'd be happy to help you further. Could you describe the specific problem you're experiencing?",
					],
				};

				vi.mocked(MessageRepo.getAllMessages).mockResolvedValue(mockMessages as never);
				vi.mocked(mockTextSuggestionCommand.instrumentedHandle).mockResolvedValue(
					suggestionResponse,
				);

				const message = {
					type: LivechatReceiveProtocolType.READY_FOR_AI_SUGGESTION as const,
					payload: {
						conversationPid: "conv-456",
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(MessageRepo.getAllMessages).toHaveBeenCalledWith({
					conversationPid: "conv-456",
					userId: "user-123",
				});

				expect(mockTextSuggestionCommand.instrumentedHandle).toHaveBeenCalledWith({
					conversationPid: "conv-456",
					userId: "user-123",
					conversation: mockMessages.map((m) => ({
						senderType: m.senderType,
						content: m.content,
						contentType: m.contentType,
						createdAt: m.createdAt,
					})),
				});

				expect(mockWs.send).toHaveBeenCalledWith({
					type: LivechatSendProtocolType.AI_SUGGESTION,
					payload: {
						messages: suggestionResponse.messages,
						conversationPid: "conv-456",
					},
				});
			});

			it("should handle empty conversation history", async () => {
				vi.mocked(MessageRepo.getAllMessages).mockResolvedValue([]);
				vi.mocked(mockTextSuggestionCommand.instrumentedHandle).mockResolvedValue({
					messages: ["Hello! How can I assist you today?"],
				});

				const message = {
					type: LivechatReceiveProtocolType.READY_FOR_AI_SUGGESTION as const,
					payload: {
						conversationPid: "conv-empty",
					},
				};

				await liveChatCommand.onMessage(mockUser, mockWs, message);

				expect(mockTextSuggestionCommand.instrumentedHandle).toHaveBeenCalledWith({
					conversationPid: "conv-empty",
					userId: "user-123",
					conversation: [],
				});

				expect(mockWs.send).toHaveBeenCalled();
			});
		});
	});
});
