import { Command } from "../../../../contracts/command";
import { HttpError } from "../../../../infra/errors";
import type { textSuggestionWorkflow } from "./textSuggestion.workflow";
import type {
	TextSuggestionDto,
	TextSuggestionResponseDto,
} from "./textSuggestion.dto";

export class TextSuggestionCommand extends Command<
	TextSuggestionDto,
	TextSuggestionResponseDto
> {
	constructor(
		private readonly workflow: typeof textSuggestionWorkflow,
	) {
		super("TextSuggestionCommand");
	}

	async handle(dto: TextSuggestionDto): Promise<TextSuggestionResponseDto> {
		if (!dto.conversation || dto.conversation.length === 0) {
			throw new HttpError({
				status: 400,
				message: "Conversation cannot be empty",
				code: "EMPTY_CONVERSATION",
			});
    }

    const workflowRunner = await this.workflow.createRun()

		const result = await workflowRunner.start({
			inputData: {
				conversation: dto.conversation,
      },

		});

		if (result.status !== "success" || !result.result) {
			throw new HttpError({
				status: 500,
				message: "Failed to generate text suggestion",
				code: "TEXT_SUGGESTION_FAILED",
			});
		}

		return {
			messages: result.result.messages,
		};
	}
}
