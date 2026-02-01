import { Workflow } from "@mastra/core/workflows";
import z from "zod";
import { textCondensorPrompt } from "../textCondensor/textCondensor.prompts";
import { breakIntoMessages } from "./steps/breakIntoMessages";
import { MesssageSenderType, MessageContentType } from "../../../message/repo/message.schema";
import { respondToConversation } from "./steps/respondToConversation";

const conversationMessageSchema = z.object({
  senderType: z.nativeEnum(MesssageSenderType),
  content: z.string(),
  contentType: z.nativeEnum(MessageContentType),
  createdAt: z.date().optional(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;

export const textSuggestionWorkflow = new Workflow({
  id: 'text-suggestion-workflow',
  description: 'Workflow for generating dealership sales advisor response suggestions',
  inputSchema: z.object({
    conversation: z.array(conversationMessageSchema)
  }),
  outputSchema: z.object({ messages: z.array(z.string()) }),
  retryConfig: {
    attempts: 3,
    delay: 1000,
  }
})
  .then(respondToConversation)
  .map(async ({ inputData }) => ({
    prompt: textCondensorPrompt(inputData)
  }))
  .then(breakIntoMessages)
  .commit()
