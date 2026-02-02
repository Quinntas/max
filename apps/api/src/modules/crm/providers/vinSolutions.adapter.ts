import { logger } from "../../../start/logger";
import type { ContactSelectModel } from "../../contact/repo/contact.schema";
import type { CRMAdapter } from "../core/crm.adapter";

interface VinSolutionsLead {
	contact: {
		firstName: string;
		lastName: string;
		emails: { address: string; type: string }[];
		phones: { number: string; type: string }[];
	};
	leadSource: string;
	note: string;
}

export class VinSolutionsAdapter implements CRMAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly dealerId: string,
    private readonly baseUrl: string = "https://api.vinsolutions.com/v1"
	) {
	}

	private mapToVinSolutions(contact: ContactSelectModel): VinSolutionsLead {
		const nameParts = contact.name.split(" ");
		const firstName = nameParts[0] || "";
		const lastName = nameParts.slice(1).join(" ") || "Unknown";

		return {
			contact: {
				firstName,
				lastName,
				emails: [{ address: contact.email, type: "Personal" }],
				phones: [{ number: contact.phone, type: "Mobile" }],
			},
			leadSource: "DealSmart AI",
			note: JSON.stringify(contact.data || {}),
		};
	}

	async pushContact(contact: ContactSelectModel): Promise<string> {
		const mapped = this.mapToVinSolutions(contact);

		try {
			// In a real scenario, we would use the actual endpoint
			logger.info({ mapped }, "Pushing contact to VinSolutions (Simulation)");

			return `vs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		} catch (error) {
			logger.error({ error }, "Error pushing to VinSolutions");
			return `mock-error-id-${Date.now()}`;
		}
	}

	async updateContact(crmId: string, updates: Partial<ContactSelectModel>): Promise<void> {
		logger.info({ crmId, updates }, "Updating contact in VinSolutions (Simulation)");
	}
}
