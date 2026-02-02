import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactProvider } from "../../../contact/repo/contact.schema";
import type { UpsertContactsCommand } from "../../../contact/resources/upsertContacts/upsertContacts.command";
import type { UpsertContactsDto } from "../../../contact/resources/upsertContacts/upsertContacts.dto";
import type { GetContactsCommand } from "../getContacts/getContacts.command";
import type { HubSpotContact } from "../getContacts/getContacts.dto";
import { RebaseContactsCommand } from "./rebaseContacts.command";

vi.mock("node:crypto", () => ({
	randomUUID: vi.fn(() => "generated-uuid"),
}));

type ContactIdentifier = { pid: string; providerId: string | null };

describe("RebaseContactsCommand", () => {
	let rebaseContactsCommand: RebaseContactsCommand;
	let mockGetContactsCommand: GetContactsCommand;
	let mockUpsertContactsCommand: UpsertContactsCommand;
	let mockGetContactIdentifiersByUserId: Mock<
		(userId: string, provider: ContactProvider) => Promise<ContactIdentifier[]>
	>;

	const createHubSpotContact = (
		id: string,
		properties: Record<string, string | null>,
	): HubSpotContact<string[]> => ({
		id,
		properties,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
		archived: false,
	});

	beforeEach(() => {
		vi.clearAllMocks();

		mockGetContactsCommand = {
			handle: vi.fn(),
		} as unknown as GetContactsCommand;

		mockUpsertContactsCommand = {
			instrumentedHandle: vi.fn(),
		} as unknown as UpsertContactsCommand;

		mockGetContactIdentifiersByUserId = vi.fn();

		rebaseContactsCommand = new RebaseContactsCommand(
			mockGetContactsCommand,
			mockUpsertContactsCommand,
			mockGetContactIdentifiersByUserId as never,
		);
	});

	describe("handle", () => {
		it("should return early when no contacts are found in HubSpot", async () => {
			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: [],
			});

			await rebaseContactsCommand.handle({ userId: "user-123" });

			expect(mockGetContactsCommand.handle).toHaveBeenCalledWith({
				properties: ["name", "email", "phone", "notes"],
			});
			expect(mockGetContactIdentifiersByUserId).not.toHaveBeenCalled();
			expect(mockUpsertContactsCommand.instrumentedHandle).not.toHaveBeenCalled();
		});

		it("should create new contacts when none exist locally", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-1", {
					name: "John Doe",
					email: "john@example.com",
					phone: "+1234567890",
					notes: "VIP customer",
				}),
				createHubSpotContact("hs-2", {
					name: "Jane Smith",
					email: "jane@example.com",
					phone: "+0987654321",
					notes: null,
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			expect(mockGetContactIdentifiersByUserId).toHaveBeenCalledWith(
				"user-123",
				ContactProvider.HUBSPOT,
			);

			expect(mockUpsertContactsCommand.instrumentedHandle).toHaveBeenCalledWith({
				userId: "user-123",
				contact: [
					{
						pid: "generated-uuid",
						userId: "user-123",
						name: "John Doe",
						email: "john@example.com",
						phone: "+1234567890",
						provider: ContactProvider.HUBSPOT,
						providerId: "hs-1",
						data: { notes: "VIP customer" },
					},
					{
						pid: "generated-uuid",
						userId: "user-123",
						name: "Jane Smith",
						email: "jane@example.com",
						phone: "+0987654321",
						provider: ContactProvider.HUBSPOT,
						providerId: "hs-2",
						data: { notes: null },
					},
				],
			});
		});

		it("should reuse existing PIDs for contacts that already exist", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-1", {
					name: "John Doe Updated",
					email: "john.new@example.com",
					phone: "+1234567890",
					notes: "Updated notes",
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([
				{ pid: "existing-pid-123", providerId: "hs-1" },
			]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			expect(mockUpsertContactsCommand.instrumentedHandle).toHaveBeenCalledWith({
				userId: "user-123",
				contact: [
					{
						pid: "existing-pid-123",
						userId: "user-123",
						name: "John Doe Updated",
						email: "john.new@example.com",
						phone: "+1234567890",
						provider: ContactProvider.HUBSPOT,
						providerId: "hs-1",
						data: { notes: "Updated notes" },
					},
				],
			});
		});

		it("should handle contacts with null properties", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-1", {
					name: null,
					email: null,
					phone: null,
					notes: null,
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			expect(mockUpsertContactsCommand.instrumentedHandle).toHaveBeenCalledWith({
				userId: "user-123",
				contact: [
					{
						pid: "generated-uuid",
						userId: "user-123",
						name: "",
						email: "",
						phone: "",
						provider: ContactProvider.HUBSPOT,
						providerId: "hs-1",
						data: { notes: null },
					},
				],
			});
		});

		it("should process contacts in batches of 50", async () => {
			const hubspotContacts = Array.from({ length: 120 }, (_, i) =>
				createHubSpotContact(`hs-${i}`, {
					name: `Contact ${i}`,
					email: `contact${i}@example.com`,
					phone: `+${i}`,
					notes: null,
				}),
			);

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			expect(mockUpsertContactsCommand.instrumentedHandle).toHaveBeenCalledTimes(3);

			const calls = vi.mocked(mockUpsertContactsCommand.instrumentedHandle).mock.calls;
			const firstCall = calls[0]?.[0] as UpsertContactsDto;
			const secondCall = calls[1]?.[0] as UpsertContactsDto;
			const thirdCall = calls[2]?.[0] as UpsertContactsDto;

			expect(firstCall.contact).toHaveLength(50);
			expect(secondCall.contact).toHaveLength(50);
			expect(thirdCall.contact).toHaveLength(20);
		});

		it("should throw error when HubSpot API fails", async () => {
			const error = new Error("HubSpot API error");
			vi.mocked(mockGetContactsCommand.handle).mockRejectedValue(error);

			await expect(
				rebaseContactsCommand.handle({ userId: "user-123" }),
			).rejects.toThrow("HubSpot API error");
		});

		it("should throw error when upsert fails", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-1", {
					name: "John Doe",
					email: "john@example.com",
					phone: "+1234567890",
					notes: null,
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([]);

			const error = new Error("Database error");
			vi.mocked(mockUpsertContactsCommand.instrumentedHandle).mockRejectedValue(error);

			await expect(
				rebaseContactsCommand.handle({ userId: "user-123" }),
			).rejects.toThrow("Database error");
		});

		it("should handle mix of new and existing contacts", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-existing", {
					name: "Existing Contact",
					email: "existing@example.com",
					phone: "+111",
					notes: null,
				}),
				createHubSpotContact("hs-new", {
					name: "New Contact",
					email: "new@example.com",
					phone: "+222",
					notes: null,
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([
				{ pid: "existing-pid", providerId: "hs-existing" },
			]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			const calls = vi.mocked(mockUpsertContactsCommand.instrumentedHandle).mock.calls;
			const upsertCall = calls[0]?.[0] as UpsertContactsDto;

			expect(upsertCall.contact[0]?.pid).toBe("existing-pid");
			expect(upsertCall.contact[0]?.providerId).toBe("hs-existing");

			expect(upsertCall.contact[1]?.pid).toBe("generated-uuid");
			expect(upsertCall.contact[1]?.providerId).toBe("hs-new");
		});

		it("should preserve extra properties in data field", async () => {
			const hubspotContacts = [
				createHubSpotContact("hs-1", {
					name: "John Doe",
					email: "john@example.com",
					phone: "+1234567890",
					notes: "Some notes",
					customField1: "custom value 1",
					customField2: "custom value 2",
				}),
			];

			vi.mocked(mockGetContactsCommand.handle).mockResolvedValue({
				contacts: hubspotContacts,
			});
			mockGetContactIdentifiersByUserId.mockResolvedValue([]);

			await rebaseContactsCommand.handle({ userId: "user-123" });

			const calls = vi.mocked(mockUpsertContactsCommand.instrumentedHandle).mock.calls;
			const upsertCall = calls[0]?.[0] as UpsertContactsDto;

			expect(upsertCall.contact[0]?.data).toEqual({
				notes: "Some notes",
				customField1: "custom value 1",
				customField2: "custom value 2",
			});
		});
	});
});
