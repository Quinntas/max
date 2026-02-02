import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import { logger } from "../../../../start/logger";
import { qualificationWorkflow } from "../../../ai/resources/qualification/qualification.workflow";
import { ConsentRepo } from "../../../consent/repo/consent.repo";
import { ContactRepo } from "../../../contact/repo/contact.repo";
import {
	ContactChannel,
	ContactStatus,
} from "../../../contact/repo/contact.schema";
import { ConversationRepo } from "../../../conversation/repo/conversation.repo";
import { ConversationStatus } from "../../../conversation/repo/conversation.schema";
import { VinSolutionsAdapter } from "../../../crm/providers/vinSolutions.adapter";
import { DealershipRepo } from "../../../dealership/repo/dealership.repo";
import { CrmType } from "../../../dealership/repo/dealership.schema";
import { EscalationRepo } from "../../../escalation/repo/escalation.repo";
import { MessageRepo } from "../../../message/repo/message.repo";
import {
	MessageContentType,
	MesssageSenderType,
} from "../../../message/repo/message.schema";
import { CreateMessageCommand } from "../../../message/resources/createMessage/createMessage.command";
import { HandleIncomingSmsDto } from "./handleIncomingSms.dto";

export class HandleIncomingSmsCommand extends Command<
	HandleIncomingSmsDto,
	void
> {
	constructor(
		private readonly getDealershipByPhone: typeof DealershipRepo.getDealershipByPhone,
		private readonly getContactByPhoneAndDealership: typeof ContactRepo.getContactByPhoneAndDealership,
		private readonly updateContactById: typeof ContactRepo.updateContactById,
		private readonly getOpenConversationByContactId: typeof ConversationRepo.getOpenConversationByContactId,
		private readonly createConversation: typeof ConversationRepo.createConversation,
		private readonly createMessageCommand: CreateMessageCommand,
		private readonly getLastMessagesByConversationId: typeof MessageRepo.getLastMessagesByConversationId,
		private readonly hasConsent: typeof ConsentRepo.hasConsent,
		private readonly createEscalation: typeof EscalationRepo.createEscalation,
		private readonly workflow: typeof qualificationWorkflow,
		private readonly crmAdapter: VinSolutionsAdapter,
	) {
		super("HandleIncomingSmsCommand");
	}

	async handle(dto: HandleIncomingSmsDto): Promise<void> {
		const { from, to, body } = dto;

		const [dealership] = await this.getDealershipByPhone(to);

		if (!dealership) {
			logger.error({ to }, "No dealership found for incoming number");
			return;
		}

		let [contact] = await this.getContactByPhoneAndDealership(
			from,
			dealership.id,
		);

		if (!contact) {
			throw new HttpError({
				message: "Contact not found",
				status: 404,
			});
		}

		let [conversation] = await this.getOpenConversationByContactId(contact.id);

		if (!conversation) {
			[conversation] = await this.createConversation({
				contactId: contact.id,
				userId: contact.userId,
				status: ConversationStatus.NEW,
			});
		}

		if (!conversation) {
			logger.error("Failed to find or create conversation");
			return;
		}

		await this.createMessageCommand.instrumentedHandle({
			conversationPid: conversation.pid,
			senderType: MesssageSenderType.COSTUMER,
			content: body,
      contentType: MessageContentType.TEXT,
			userId: contact.userId
		});

		const history = await this.getLastMessagesByConversationId(
			conversation.id,
			10,
		);

		const conversationContext = history
			.reverse()
			.map((m) => `${m.senderType}: ${m.content}`)
			.join("\n");

		try {
			const hasConsentRecord = await this.hasConsent(
				contact.id,
				ContactChannel.SMS,
			);
			const hasConsent =
				hasConsentRecord || process.env.NODE_ENV === "development";
			logger.info(
				{ hasConsentRecord, hasConsent, contactId: contact.id },
				"Consent check",
			);

			const run = await this.workflow.createRun();
			const workflowResult = await run.start({
				inputData: {
					messageContent: body,
					conversationContext,
					contactId: contact.id,
					channel: ContactChannel.SMS,
					dealership: {
						id: dealership.id,
						pid: dealership.pid,
						name: dealership.name,
						brand: dealership.brand,
						config: dealership.config as Record<string, unknown>,
					},
					hasConsent,
				},
			});

			if (workflowResult.status !== "success") {
				logger.warn(
					{ status: workflowResult.status },
					"Workflow did not succeed",
				);
				if (workflowResult.status === "failed")
					logger.error(workflowResult.error);
				return;
			}

			const result = workflowResult.result;

			logger.info({ result }, "Workflow result");

			if (result) {
				if (result.qualification) {
					const [updatedContact] = await this.updateContactById(contact.id, {
						intent: result.qualification.intent,
						qualificationScore: result.qualification.score,
						timeline: result.qualification.timeline || undefined,
						vehicleInterest: result.qualification.vehicleInterest
							? {
									make: result.qualification.vehicleInterest.make || undefined,
									model: result.qualification.vehicleInterest.model || undefined,
									year: result.qualification.vehicleInterest.year || undefined,
								}
							: undefined,
						tradeIn: result.qualification.hasTradeIn
							? {
									hasTradeIn: true,
									vehicle: undefined,
									year: undefined,
									make: undefined,
									model: undefined,
									mileage: undefined,
								}
							: undefined,
						status:
							result.qualification.recommendation === "ESCALATE"
								? ContactStatus.ESCALATED
								: result.qualification.recommendation === "QUALIFIED"
									? ContactStatus.QUALIFIED
									: ContactStatus.NURTURE,
					});

					if (updatedContact) {
						contact = updatedContact;
					}

					if (
						dealership.crmType === CrmType.VINSOLUTIONS &&
						dealership.crmApiKey
					) {
						try {
							const crmId = await this.crmAdapter.pushContact(contact);

							await this.updateContactById(contact.id, {
								crmExternalId: crmId,
							});
						} catch (error) {
							logger.error(
								{ error, contactId: contact.id },
								"Failed to sync with CRM",
							);
						}
					}
				}

				if (result.action === "ESCALATE" && result.escalation) {
					await this.createEscalation({
						contactId: contact.id,
						reason: result.escalation.reason,
						aiConfidence: result.escalation.aiConfidence,
						handedOffAt: new Date(),
						notes: "Escalated by AI workflow",
					});
				}

				logger.info(
					{ messageChunks: result.messageChunks, action: result.action },
					"Processing message chunks",
				);
				if (result.messageChunks && result.messageChunks.length > 0) {
					for (const chunk of result.messageChunks) {
						logger.info(
							{ chunk, conversationId: conversation.id },
							"Creating AI message",
						);
						await this.createMessageCommand.instrumentedHandle({
							conversationPid: conversation.pid,
							senderType: MesssageSenderType.AI_AGENT,
							content: chunk,
              contentType: MessageContentType.TEXT,
							userId: contact.userId
						});
					}
				} else {
					logger.warn({ action: result.action }, "No message chunks to save");
				}
			}
		} catch (err) {
			logger.error({ err }, "Workflow execution failed");
		}
	}
}
