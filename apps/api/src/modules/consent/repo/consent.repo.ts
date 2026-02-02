import { and, eq } from "drizzle-orm";
import { db } from "../../../start/drizzle";
import { type ConsentInsertModel, consentSchema, ConsentType } from "./consent.schema";
import { ContactChannel } from "../../contact/repo/contact.schema";

export namespace ConsentRepo {
	export function createConsent(data: ConsentInsertModel) {
		return db.insert(consentSchema).values(data).returning();
	}

	export function getConsentByContactId(contactId: number) {
		return db.select().from(consentSchema).where(eq(consentSchema.contactId, contactId));
	}

	export async function hasConsent(
		contactId: number,
		channel: ContactChannel,
	): Promise<boolean> {
		let consentType: ConsentType;
		switch (channel) {
			case ContactChannel.SMS:
				consentType = ConsentType.TCPA_SMS;
				break;
			case ContactChannel.VOICE:
				consentType = ConsentType.TCPA_VOICE;
				break;
			case ContactChannel.EMAIL:
				consentType = ConsentType.EMAIL_MARKETING;
				break;
			default:
				return false;
		}

		const [consent] = await db
			.select()
			.from(consentSchema)
			.where(
				and(
					eq(consentSchema.contactId, contactId),
					eq(consentSchema.consentType, consentType),
					eq(consentSchema.granted, true),
				),
			)
			.limit(1);

		return !!consent;
	}
}
