import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { textCondensorAgent } from "../../textCondensor/textCondensor.agent";

export const breakIntoMessages = createStep({
  id: "break-into-messages",
  description: "Condenses response into short text messages",
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ messages: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    const response = await textCondensorAgent.generate(
      [{ role: "user", content: inputData.prompt }],
      {
        structuredOutput: {
          schema: z.object({
            messages: z.array(z.string()),
          }),
        },
      },
    );

    if (!response.object) throw new Error("Error generating messages");

    return response.object;
  },
});
