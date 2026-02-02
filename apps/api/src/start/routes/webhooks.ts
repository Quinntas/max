import { Elysia, t } from "elysia";
import { logger } from "../logger";
import { handleIncomingSmsCommand } from "../../modules/channel/resources/handleIncomingSms";
import { twilioProvider } from "../../modules/channel/providers";

export const webhooksRoutes = new Elysia({ prefix: "/webhooks" })
	.post(
		"/twilio/sms",
		async ({ body, headers, request, set }) => {
			try {
				const signature = headers["x-twilio-signature"] || "";
				const url = request.url;
				const rawBody = JSON.stringify(body);

				if (!twilioProvider.verifySignature(rawBody, signature, url)) {
					logger.warn({ signature }, "Invalid Twilio signature");
					// In production, might want to return 403 here
				}

				const incoming = await twilioProvider.parseWebhook(
					body,
					headers as Record<string, string>,
				);

				logger.info(
					{
						from: incoming.from,
						to: incoming.to,
						body: incoming.body.substring(0, 50),
						externalId: incoming.externalId,
					},
					"Received SMS webhook",
				);

				await handleIncomingSmsCommand.handle({
					from: incoming.from,
					to: incoming.to,
					body: incoming.body,
					messageSid: incoming.externalId,
				});

				return new Response(
					'<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
					{
						headers: { "Content-Type": "application/xml" },
					},
				);
			} catch (error) {
				logger.error({ error }, "Webhook handler error");
				set.status = 500;
				return new Response(
					JSON.stringify({
						error: "Internal Server Error",
						details: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					}),
					{
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		},
		{
			detail: {
				tags: ["Webhooks"],
				summary: "Twilio SMS webhook",
			},
			body: t.Object({
				MessageSid: t.String(),
				AccountSid: t.String(),
				From: t.String(),
				To: t.String(),
				Body: t.String(),
				NumMedia: t.Optional(t.String()),
				MediaUrl0: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/twilio/status",
		async ({ body }) => {
			logger.info(
				{
					messageSid: body.MessageSid,
					status: body.MessageStatus,
				},
				"Received SMS status update",
			);

			return { received: true };
		},
		{
			detail: {
				tags: ["Webhooks"],
				summary: "Twilio SMS status callback",
			},
			body: t.Object({
				MessageSid: t.String(),
				MessageStatus: t.String(),
				To: t.Optional(t.String()),
				From: t.Optional(t.String()),
				ErrorCode: t.Optional(t.String()),
				ErrorMessage: t.Optional(t.String()),
			}),
		},
	);
