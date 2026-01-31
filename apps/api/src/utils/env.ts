import "dotenv/config";

import z from "zod";

const envSchema = z.object({
	PORT: z.string().transform(Number),
	FRONTEND_URL: z.string(),

	POSTGRES_USER: z.string(),
	POSTGRES_PASSWORD: z.string(),
	POSTGRES_DB: z.string(),
	DATABASE_URL: z.string(),

	REDIS_HOST: z.string(),
	REDIS_PORT: z.coerce.number(),
	REDIS_PASSWORD: z.string(),

	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string(),

	LITELLM_MASTER_KEY: z.string(),
	LITELLM_SALT_KEY: z.string(),
	LITELLM_URL: z.string(),

	OTEL_SERVICE_NAME: z.string(),
	OTEL_EXPORTER_OTLP_ENDPOINT: z.string(),
	OTEL_EXPORTER_OTLP_PROTOCOL: z.string(),

	LOKI_URL: z.string(),
	TEMPO_URL: z.string(),
	PROMETHEUS_URL: z.string(),

	HUBSPOT_ACCESS_TOKEN: z.string(),
	HUBSPOT_CLIENT_SECRET: z.string(),

	GOOGLE_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
