import { qualificationWorkflow } from "../../../ai/resources/qualification/qualification.workflow";
import { ConsentRepo } from "../../../consent/repo/consent.repo";
import { ContactRepo } from "../../../contact/repo/contact.repo";
import { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import { vinSolutionsAdapter } from "../../../crm/providers";
import { DealershipRepo } from "../../../dealership/repo/dealership.repo";
import { EscalationRepo } from "../../../escalation/repo/escalation.repo";
import { MessageRepo } from "../../../message/repo/message.repo";
import { createMessageCommand } from "../../../message/resources/createMessage";
import { HandleIncomingSmsCommand } from "./handleIncomingSms.command";

export const handleIncomingSmsCommand = new HandleIncomingSmsCommand(
	DealershipRepo.getDealershipByPhone,
	ContactRepo.getContactByPhoneAndDealership,
	ContactRepo.updateContactById,
	ConversationRepo.getOpenConversationByContactId,
	ConversationRepo.createConversation,
	createMessageCommand,
	MessageRepo.getLastMessagesByConversationId,
	ConsentRepo.hasConsent,
	EscalationRepo.createEscalation,
	qualificationWorkflow,
	vinSolutionsAdapter,
);
