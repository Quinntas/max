export interface ValidationResult {
	valid: boolean;
	violations: string[];
}

const HALLUCINATION_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
	{ pattern: /\$[\d,]+/, description: "specific_dollar_amount" },
	{ pattern: /\d+%\s*(apr|interest|off|discount)/i, description: "specific_percentage" },
	{ pattern: /\b(guarantee|promise|definitely|for sure|absolutely)\b/i, description: "guarantee_language" },
	{ pattern: /\b(in stock|available now|we have \d+|currently have)\b/i, description: "inventory_claim" },
	{ pattern: /trade.?in.*worth.*\$[\d,]+/i, description: "trade_in_value" },
	{ pattern: /\b(approved|pre-approved) for/i, description: "financing_approval" },
	{ pattern: /deliver(y|ed)? (by|on|within) \w+/i, description: "delivery_date" },
	{ pattern: /\b(msrp|sticker price) (is|of) \$[\d,]+/i, description: "msrp_quote" },
];

const STOP_PATTERNS = /\b(stop|unsubscribe|cancel|quit|end|opt.?out)\b/i;

const HUMAN_REQUEST_PATTERNS =
	/\b(speak|talk|connect|transfer).*(human|person|agent|someone|representative|manager)\b/i;

const PRICE_NEGOTIATION_PATTERNS = /\b(best price|otd|out.?the.?door|bottom line|lowest|deal)\b/i;

const ANGRY_PATTERNS =
	/\b(angry|furious|upset|frustrated|ridiculous|unacceptable|terrible|worst|hate|lawsuit|sue|attorney|lawyer|bbb|complaint)\b/i;

export function validateResponse(response: string): ValidationResult {
	const violations: string[] = [];

	for (const { pattern, description } of HALLUCINATION_PATTERNS) {
		if (pattern.test(response)) {
			violations.push(description);
		}
	}

	return {
		valid: violations.length === 0,
		violations,
	};
}

export function detectStopMessage(message: string): boolean {
	const trimmed = message.trim().toLowerCase();
	if (trimmed === "stop" || trimmed === "unsubscribe") {
		return true;
	}
	return STOP_PATTERNS.test(message);
}

export function detectHumanRequest(message: string): boolean {
	return HUMAN_REQUEST_PATTERNS.test(message);
}

export function detectPriceNegotiation(message: string): boolean {
	return PRICE_NEGOTIATION_PATTERNS.test(message);
}

export function detectAngrySentiment(message: string): boolean {
	return ANGRY_PATTERNS.test(message);
}

export interface EscalationCheck {
	shouldEscalate: boolean;
	reason: string | null;
}

export function checkEscalationTriggers(message: string, aiConfidence?: number): EscalationCheck {
	if (detectStopMessage(message)) {
		return { shouldEscalate: false, reason: null };
	}

	if (detectAngrySentiment(message)) {
		return { shouldEscalate: true, reason: "ANGRY_CUSTOMER" };
	}

	if (detectHumanRequest(message)) {
		return { shouldEscalate: true, reason: "EXPLICIT_REQUEST" };
	}

	if (detectPriceNegotiation(message)) {
		return { shouldEscalate: true, reason: "PRICE_REQUEST" };
	}

	if (aiConfidence !== undefined && aiConfidence < 0.6) {
		return { shouldEscalate: true, reason: "AI_UNCERTAINTY" };
	}

	return { shouldEscalate: false, reason: null };
}

export function sanitizeResponse(response: string): string {
	let sanitized = response;

	sanitized = sanitized.replace(/\$[\d,]+(\.\d{2})?/g, "[price available upon request]");
	sanitized = sanitized.replace(/\d+(\.\d+)?%\s*(apr|interest)/gi, "[rate details available]");

	return sanitized;
}

export function isWithinBusinessHours(
	timezone: string,
	businessHours: Record<string, { open: string; close: string }> | null | undefined,
): boolean {
	if (!businessHours) {
		return true;
	}

	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "long",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const parts = formatter.formatToParts(now);
	const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
	const hour = parts.find((p) => p.type === "hour")?.value;
	const minute = parts.find((p) => p.type === "minute")?.value;

	if (!weekday || !hour || !minute) {
		return true;
	}

	const todayHours = businessHours[weekday];
	if (!todayHours) {
		return false;
	}

	const currentTime = `${hour}:${minute}`;
	return currentTime >= todayHours.open && currentTime <= todayHours.close;
}
