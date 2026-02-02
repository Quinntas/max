import { Kbd } from "@/components/ui/kbd";

interface SuggestionKeyboardHintsProps {
	hasMultipleSuggestions: boolean;
}

export function SuggestionKeyboardHints({
	hasMultipleSuggestions,
}: SuggestionKeyboardHintsProps) {
	return (
		<div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
			<span className="flex items-center gap-1">
				<Kbd>Enter</Kbd> to send
			</span>
			<span className="flex items-center gap-1">
				<Kbd>Ctrl</Kbd>+<Kbd>E</Kbd> to edit
			</span>
			<span className="flex items-center gap-1">
				<Kbd>Ctrl</Kbd>+<Kbd>R</Kbd> to regenerate
			</span>
			<span className="flex items-center gap-1">
				<Kbd>Ctrl</Kbd>+<Kbd>D</Kbd> to dismiss
			</span>
			{hasMultipleSuggestions && (
				<span className="flex items-center gap-1">
					<Kbd>↑</Kbd>
					<Kbd>↓</Kbd> to navigate
				</span>
			)}
		</div>
	);
}
