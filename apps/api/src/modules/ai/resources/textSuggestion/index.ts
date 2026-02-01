import { textSuggestionWorkflow } from "./textSuggestion.workflow";
import { TextSuggestionCommand } from "./textSuggestion.command";

export const textSuggestionCommand = new TextSuggestionCommand(
	textSuggestionWorkflow,
);
