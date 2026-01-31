import { context, trace } from "@opentelemetry/api";
import pino from "pino";

export const logger = pino({
	level: "info",
	mixin() {
		const span = trace.getSpan(context.active());
		if (span) {
			const { traceId, spanId } = span.spanContext();
			return {
				trace_id: traceId,
				span_id: spanId,
			};
		}
		return {};
	},
});
