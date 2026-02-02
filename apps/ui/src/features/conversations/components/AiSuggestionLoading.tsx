import { IconSparkles } from "@tabler/icons-react";

export function AiSuggestionLoading() {
	return (
		<div className="px-3 md:px-4 pt-3 md:pt-4">
			<div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
				<IconSparkles className="h-4 w-4 text-primary" />
				<span>Generating suggestions...</span>
			</div>
		</div>
	);
}
