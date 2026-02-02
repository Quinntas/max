import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ContactChannel,
	ContactIntent,
	ContactProvider,
	ContactStatus,
	type ContactSelectModel,
} from "../../../contact/repo/contact.schema";
import {
	ConversationStatus,
	type ConversationSelectModel,
} from "../../../conversation/repo/conversation.schema";
import type { VinSolutionsAdapter } from "../../../crm/providers/vinSolutions.adapter";
import { CrmType } from "../../../dealership/repo/dealership.schema";
import {
	MessageContentType,
	MesssageSenderType,
} from "../../../message/repo/message.schema";
import type { CreateMessageCommand } from "../../../message/resources/createMessage/createMessage.command";
import { HandleIncomingSmsCommand } from "./handleIncomingSms.command";

describe("HandleIncomingSmsCommand", () => {
	let handleIncomingSmsCommand: HandleIncomingSmsCommand;
	let mockGetDealershipByPhone: Mock;
	let mockGetContactByPhoneAndDealership: Mock;
	let mockUpdateContactById: Mock;
	let mockGetOpenConversationByContactId: Mock;
	let mockCreateConversation: Mock;
	let mockCreateMessageCommand: CreateMessageCommand;
	let mockGetLastMessagesByConversationId: Mock;
	let mockHasConsent: Mock;
	let mockCreateEscalation: Mock;
	let mockWorkflow: { createRun: Mock };
	let mockCrmAdapter: VinSolutionsAdapter;

	const mockDealership = {
		id: 1,
		pid: "dealership-pid",
		name: "Test Dealership",
		brand: "Toyota",
		config: { tone: "friendly" },
		crmType: null,
		crmApiKey: null,
	};

	const mockContact: ContactSelectModel = {
		id: 1,
		pid: "contact-pid",
		userId: "user-123",
		name: "John Doe",
		email: "john@example.com",
		phone: "+1234567890",
		data: {},
		provider: ContactProvider.SMS,
		providerId: null,
		dealershipId: 1,
		channel: ContactChannel.SMS,
		status: ContactStatus.NEW,
		intent: null,
		qualificationScore: null,
		timeline: null,
		budget: null,
		tradeIn: null,
		vehicleInterest: null,
		appointmentScheduled: null,
		crmExternalId: null,
		assignedTo: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockConversation: ConversationSelectModel = {
		id: 1,
		pid: "conversation-pid",
		contactId: 1,
		userId: "user-123",
		status: ConversationStatus.NEW,
		lastMessageAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockGetDealershipByPhone = vi.fn();
		mockGetContactByPhoneAndDealership = vi.fn();
		mockUpdateContactById = vi.fn();
		mockGetOpenConversationByContactId = vi.fn();
		mockCreateConversation = vi.fn();
		mockCreateMessageCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as CreateMessageCommand;
		mockGetLastMessagesByConversationId = vi.fn();
		mockHasConsent = vi.fn();
		mockCreateEscalation = vi.fn();
		mockWorkflow = {
			createRun: vi.fn(),
		};
		mockCrmAdapter = {
			pushContact: vi.fn(),
		} as unknown as VinSolutionsAdapter;

		handleIncomingSmsCommand = new HandleIncomingSmsCommand(
			mockGetDealershipByPhone as never,
			mockGetContactByPhoneAndDealership as never,
			mockUpdateContactById as never,
			mockGetOpenConversationByContactId as never,
			mockCreateConversation as never,
			mockCreateMessageCommand,
			mockGetLastMessagesByConversationId as never,
			mockHasConsent as never,
			mockCreateEscalation as never,
			mockWorkflow as never,
			mockCrmAdapter,
		);
	});

	describe("handle", () => {
		it("should return early when no dealership is found", async () => {
			mockGetDealershipByPhone.mockResolvedValue([]);

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Hello",
				messageSid: "SM123",
			});

			expect(mockGetDealershipByPhone).toHaveBeenCalledWith("+0987654321");
			expect(mockGetContactByPhoneAndDealership).not.toHaveBeenCalled();
		});

		it("should throw error when contact is not found", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([]);

			await expect(
				handleIncomingSmsCommand.handle({
					from: "+1234567890",
					to: "+0987654321",
					body: "Hello",
					messageSid: "SM123",
				}),
			).rejects.toThrow("Contact not found");
		});

		it("should create a new conversation if none exists", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([]);
			mockCreateConversation.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						messageChunks: ["Hello! How can I help you?"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Hello",
				messageSid: "SM123",
			});

			expect(mockCreateConversation).toHaveBeenCalledWith({
				contactId: mockContact.id,
				userId: mockContact.userId,
				status: ConversationStatus.NEW,
			});
		});

		it("should use existing conversation if one exists", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						messageChunks: ["Hello!"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Hello",
				messageSid: "SM123",
			});

			expect(mockCreateConversation).not.toHaveBeenCalled();
		});

		it("should create customer message before running workflow", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						messageChunks: ["Response"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "I want to buy a car",
				messageSid: "SM123",
			});

			expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenCalledWith({
				conversationPid: mockConversation.pid,
				senderType: MesssageSenderType.COSTUMER,
				content: "I want to buy a car",
				contentType: MessageContentType.TEXT,
				userId: mockContact.userId,
			});
		});

		it("should run qualification workflow with correct input", async () => {
			const mockRunStart = vi.fn().mockResolvedValue({
				status: "success",
				result: {
					messageChunks: ["Response"],
					action: "RESPOND",
				},
			});

			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([
				{ senderType: MesssageSenderType.AI_AGENT, content: "Hello!" },
				{ senderType: MesssageSenderType.COSTUMER, content: "Hi" },
			]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({ start: mockRunStart });

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "I want to buy a car",
				messageSid: "SM123",
			});

			expect(mockRunStart).toHaveBeenCalledWith({
				inputData: {
					messageContent: "I want to buy a car",
					conversationContext: "COSTUMER: Hi\nAI_AGENT: Hello!",
					contactId: mockContact.id,
					channel: ContactChannel.SMS,
					dealership: {
						id: mockDealership.id,
						pid: mockDealership.pid,
						name: mockDealership.name,
						brand: mockDealership.brand,
						config: mockDealership.config,
					},
					hasConsent: true,
				},
			});
		});

		it("should update contact with qualification data", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.SALES,
							score: 85,
							timeline: "immediate",
							vehicleInterest: { make: "Toyota", model: "Camry", year: 2024 },
							hasTradeIn: true,
							recommendation: "QUALIFIED",
						},
						messageChunks: ["Great choice!"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "I want to buy a Toyota Camry",
				messageSid: "SM123",
			});

			expect(mockUpdateContactById).toHaveBeenCalledWith(mockContact.id, {
				intent: ContactIntent.SALES,
				qualificationScore: 85,
				timeline: "immediate",
				vehicleInterest: { make: "Toyota", model: "Camry", year: 2024 },
				tradeIn: {
					hasTradeIn: true,
					vehicle: undefined,
					year: undefined,
					make: undefined,
					model: undefined,
					mileage: undefined,
				},
				status: ContactStatus.QUALIFIED,
			});
		});

		it("should set contact status to ESCALATED when recommendation is ESCALATE", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.SALES,
							score: 30,
							recommendation: "ESCALATE",
						},
						escalation: {
							reason: "ANGRY_CUSTOMER",
							aiConfidence: 0.4,
						},
						messageChunks: ["Let me connect you with a manager."],
						action: "ESCALATE",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "This is ridiculous!",
				messageSid: "SM123",
			});

			expect(mockUpdateContactById).toHaveBeenCalledWith(
				mockContact.id,
				expect.objectContaining({
					status: ContactStatus.ESCALATED,
				}),
			);
		});

		it("should create escalation record when action is ESCALATE", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.SALES,
							score: 30,
							recommendation: "ESCALATE",
						},
						escalation: {
							reason: "PRICE_REQUEST",
							aiConfidence: 0.5,
						},
						messageChunks: ["Let me get you a quote."],
						action: "ESCALATE",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "What's your best OTD price?",
				messageSid: "SM123",
			});

			expect(mockCreateEscalation).toHaveBeenCalledWith({
				contactId: mockContact.id,
				reason: "PRICE_REQUEST",
				aiConfidence: 0.5,
				handedOffAt: expect.any(Date),
				notes: "Escalated by AI workflow",
			});
		});

		it("should create AI response messages", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						messageChunks: ["First message.", "Second message."],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Hello",
				messageSid: "SM123",
			});

			expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenCalledTimes(3);

			expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenNthCalledWith(2, {
				conversationPid: mockConversation.pid,
				senderType: MesssageSenderType.AI_AGENT,
				content: "First message.",
				contentType: MessageContentType.TEXT,
				userId: mockContact.userId,
			});

			expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenNthCalledWith(3, {
				conversationPid: mockConversation.pid,
				senderType: MesssageSenderType.AI_AGENT,
				content: "Second message.",
				contentType: MessageContentType.TEXT,
				userId: mockContact.userId,
			});
		});

		it("should sync with CRM when dealership has VinSolutions configured", async () => {
			const dealershipWithCrm = {
				...mockDealership,
				crmType: CrmType.VINSOLUTIONS,
				crmApiKey: "api-key-123",
			};

			mockGetDealershipByPhone.mockResolvedValue([dealershipWithCrm]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			vi.mocked(mockCrmAdapter.pushContact).mockResolvedValue("crm-id-456");
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.SALES,
							score: 80,
							recommendation: "QUALIFIED",
						},
						messageChunks: ["Thanks!"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "I want to buy a car",
				messageSid: "SM123",
			});

			expect(mockCrmAdapter.pushContact).toHaveBeenCalledWith(mockContact);
			expect(mockUpdateContactById).toHaveBeenCalledWith(mockContact.id, {
				crmExternalId: "crm-id-456",
			});
		});

		it("should not sync with CRM when dealership has no CRM configured", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.SALES,
							score: 80,
							recommendation: "QUALIFIED",
						},
						messageChunks: ["Thanks!"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "I want to buy a car",
				messageSid: "SM123",
			});

			expect(mockCrmAdapter.pushContact).not.toHaveBeenCalled();
		});

		it("should handle workflow failure gracefully", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "failed",
					error: new Error("Workflow failed"),
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Hello",
				messageSid: "SM123",
			});

			expect(mockCreateMessageCommand.instrumentedHandle).toHaveBeenCalledTimes(1);
		});

		it("should handle workflow exception gracefully", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockRejectedValue(new Error("Unexpected error")),
			});

			await expect(
				handleIncomingSmsCommand.handle({
					from: "+1234567890",
					to: "+0987654321",
					body: "Hello",
					messageSid: "SM123",
				}),
			).resolves.not.toThrow();
		});

		it("should set status to NURTURE when recommendation is neither QUALIFIED nor ESCALATE", async () => {
			mockGetDealershipByPhone.mockResolvedValue([mockDealership]);
			mockGetContactByPhoneAndDealership.mockResolvedValue([mockContact]);
			mockGetOpenConversationByContactId.mockResolvedValue([mockConversation]);
			mockGetLastMessagesByConversationId.mockResolvedValue([]);
			mockHasConsent.mockResolvedValue(true);
			mockUpdateContactById.mockResolvedValue([mockContact]);
			mockWorkflow.createRun.mockReturnValue({
				start: vi.fn().mockResolvedValue({
					status: "success",
					result: {
						qualification: {
							intent: ContactIntent.UNKNOWN,
							score: 20,
							recommendation: "NURTURE",
						},
						messageChunks: ["Thanks for reaching out!"],
						action: "RESPOND",
					},
				}),
			});

			await handleIncomingSmsCommand.handle({
				from: "+1234567890",
				to: "+0987654321",
				body: "Just browsing",
				messageSid: "SM123",
			});

			expect(mockUpdateContactById).toHaveBeenCalledWith(
				mockContact.id,
				expect.objectContaining({
					status: ContactStatus.NURTURE,
				}),
			);
		});
	});
});
