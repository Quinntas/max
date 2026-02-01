import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { dealershipAdvisorAgent } from "../../dealershipAdvisor/dealershipAdvisor.agent";
import { dealershipAdvisorPrompt } from "../../dealershipAdvisor/dealershipAdvisor.prompts";
import { MesssageSenderType, MessageContentType } from "../../../../message/repo/message.schema";

const conversationMessageSchema = z.object({
  senderType: z.nativeEnum(MesssageSenderType),
  content: z.string(),
  contentType: z.nativeEnum(MessageContentType),
  createdAt: z.date().optional(),
});

function formatConversation(messages: z.infer<typeof conversationMessageSchema>[]): string {
  return messages
    .map((msg) => {
      const sender = msg.senderType === MesssageSenderType.COSTUMER
        ? "Customer"
        : msg.senderType === MesssageSenderType.HUMAN_AGENT
          ? "Sales Advisor"
          : "AI Assistant";
      return `${sender}: ${msg.content}`;
    })
    .join("\n");
}

export const respondToConversation = createStep({
  id: "respond-to-conversation",
  description: "Generate dealership advisor response to conversation",
  inputSchema: z.object({
    conversation: z.array(conversationMessageSchema)
  }),
  outputSchema: z.object({ response: z.string() }),
  execute: async ({ inputData }) => {
    const formattedConversation = formatConversation(inputData.conversation);
    const prompt = dealershipAdvisorPrompt({ formattedConversation });

    const response = await dealershipAdvisorAgent.generate([
      { role: "user", content: prompt },
    ]);

    return { response: response.text };
  },
});
