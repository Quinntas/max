import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "../../../../utils/env";

type Models =
  | "openai/gpt-5-chat"
  | 'openai/gpt-5-mini'
  | 'openai/gpt-5'
  | 'openai/gpt-5-nano'
  | 'openai/o3-mini'
  | 'openai/gpt-4o'

interface LitellmModelToAiSdkModelProps {
  modelName: Models,
  metadata: { tags: string[] },
  cache: boolean
}

export function litellmModelToAiSdkModel({modelName, metadata, cache}:LitellmModelToAiSdkModelProps): LanguageModelV3 {
  const model = createOpenAICompatible({
    name: modelName,
    baseURL: env.LITELLM_URL,
    apiKey: env.LITELLM_MASTER_KEY,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    // @ts-expect-error
    fetch: (url, init) => {
      const body: Record<string, unknown> = init ? (init.body ? JSON.parse(init.body as string) : {}) : {};

      if (body.response_format && (body.response_format as { type?: string }).type === 'json_object') {
        const messages = body.messages as Array<{ role: string; content: string }> | undefined;
        if (messages && messages.length > 0) {
          const hasJsonMention = messages.some(m =>
            typeof m.content === 'string' && m.content.toLowerCase().includes('json')
          );
          if (!hasJsonMention) {
            const systemMsg = messages.find(m => m.role === 'system');
            if (systemMsg) {
              systemMsg.content = `Respond in JSON format.\n\n${systemMsg.content}`;
            } else {
              messages.unshift({ role: 'system', content: 'Respond in JSON format.' });
            }
          }
        }
      }

      return fetch(url, {
        ...init,
        body: JSON.stringify({
          ...body,
          metadata,
          cache: cache ? {"no-cache": true} : {},
        }),
      });
    },
  });
  return model(modelName);
}
