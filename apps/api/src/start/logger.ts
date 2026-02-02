import { context, trace } from "@opentelemetry/api";
import pino from "pino";

const lokiUrl = process.env.LOKI_URL;
const serviceName = process.env.OTEL_SERVICE_NAME || "api";

const targets: pino.TransportTargetOptions[] = [
	{
		target: "pino/file",
		options: { destination: 1 },
		level: "info",
	},
];

if (lokiUrl) {
	targets.push({
		target: "pino-loki",
		options: {
			batching: true,
			interval: 5,
			host: lokiUrl,
			labels: { service: serviceName, app: "max-assessment" },
		},
		level: "info",
	});
}

export const logger = pino(
	{
		level: "info",
		mixin() {
			const span = trace.getSpan(context.active());
			if (span) {
				const { traceId, spanId } = span.spanContext();
				return {
					traceId,
					spanId,
					service: serviceName,
				};
			}
			return { service: serviceName };
		},
	},
	pino.transport({ targets }),
);
