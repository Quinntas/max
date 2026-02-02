import { db } from "../../../start/drizzle";
import { type EscalationInsertModel, escalationSchema } from "./escalation.schema";

export namespace EscalationRepo {
	export function createEscalation(data: EscalationInsertModel) {
		return db.insert(escalationSchema).values(data).returning();
	}
}
