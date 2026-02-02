import { Agent } from "@mastra/core/agent";
import { litellmModelToAiSdkModel } from "../../core/adapters/litellmModelToAiSdkModel";
import { agentStorage } from "../../../../start/mastra";
import { createMaxSystemPrompt, type MaxPromptConfig } from "./max.prompts";
import type { DealershipSelectModel } from "../../../dealership/repo/dealership.schema";

const agentCache = new Map<string, Agent>();

export function createMaxAgent(dealership: DealershipSelectModel): Agent {
	const cacheKey = `max-agent-${dealership.pid}`;

	const cached = agentCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const promptConfig: MaxPromptConfig = {
		dealershipName: dealership.name,
		brand: dealership.brand,
		config: dealership.config,
	};

	const agent = new Agent({
		id: cacheKey,
		name: `Max - ${dealership.name}`,
		instructions: createMaxSystemPrompt(promptConfig),
		model: litellmModelToAiSdkModel({
			modelName: "openai/gpt-4o",
			cache: true,
			metadata: {
				tags: ["max-agent", dealership.brand || "generic"],
			},
		}),
		memory: agentStorage,
	});

	agentCache.set(cacheKey, agent);
	return agent;
}

export function clearAgentCache(dealershipPid?: string): void {
	if (dealershipPid) {
		agentCache.delete(`max-agent-${dealershipPid}`);
	} else {
		agentCache.clear();
	}
}

export const defaultMaxAgent = new Agent({
	id: "max-agent-default",
	name: "Max - Default",
	instructions: createMaxSystemPrompt({
		dealershipName: "Our Dealership",
		brand: null,
		config: null,
	}),
	model: litellmModelToAiSdkModel({
		modelName: "openai/gpt-4o",
		cache: true,
		metadata: {
			tags: ["max-agent", "default"],
		},
	}),
	memory: agentStorage,
});
