import { Agent } from "@mastra/core/agent";
import { textCondensorSystemPrompt } from "./textCondensor.prompts";
import { agentStorage } from "../../../../start/mastra";
import { litellmModelToAiSdkModel } from "../../core/adapters/litellmModelToAiSdkModel";

export const textCondensorAgent = new Agent({
  id: "text-condensor-agent",
  name: "Text Condensor Agent",
  instructions: textCondensorSystemPrompt,
  model: litellmModelToAiSdkModel({
    modelName: 'openai/gpt-4o',
    cache: true,
    metadata: {
      tags: ['text-condensor-agent']
    }
  }),
  memory: agentStorage
});
