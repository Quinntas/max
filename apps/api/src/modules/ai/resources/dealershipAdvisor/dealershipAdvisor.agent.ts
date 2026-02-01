import { Agent } from "@mastra/core/agent";
import { dealershipAdvisorSystemPrompt } from "./dealershipAdvisor.prompts";
import { agentStorage } from "../../../../start/mastra";
import { litellmModelToAiSdkModel } from "../../core/adapters/litellmModelToAiSdkModel";

export const dealershipAdvisorAgent = new Agent({
  id: "dealership-advisor-agent",
  name: "Dealership Advisor Agent",
  instructions: dealershipAdvisorSystemPrompt,
  model: litellmModelToAiSdkModel({
    modelName: 'openai/gpt-4o',
    cache: true,
    metadata: {
      tags: ['dealership-advisor-agent']
    }
  }),
  memory: agentStorage
});
