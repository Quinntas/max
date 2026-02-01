import { cors } from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { Elysia } from "elysia";
import { env } from "../utils/env";
import { logger } from "./logger";
import { authPlugin } from "./plugins/auth.plugin";
import { openApiPlugin } from "./plugins/openapi.plugin";
import { contactsRoutes } from "./routes/contacts";
import { conversationsRoutes } from "./routes/conversations";
import { livechatRoutes } from "./routes/livechat";
import { messagesRoutes } from "./routes/messages";
import { hubspotRoutes } from "./routes/hubspot";

export const app = new Elysia()
	.use(
    cors({
      origin: env.FRONTEND_URL,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.use(
		opentelemetry({
			serviceName: env.OTEL_SERVICE_NAME,
		}),
	)
	.use(openApiPlugin)
	.onRequest(({ request }) => {
		logger.info(
			{
				method: request.method,
				url: request.url,
			},
			"Incoming request",
		);
	})
	.use(authPlugin)
	.get("/", () => {
		return { message: "ok" };
	})
	.use(conversationsRoutes)
	.use(contactsRoutes)
	.use(messagesRoutes)
	.use(hubspotRoutes)
	.use(livechatRoutes)
