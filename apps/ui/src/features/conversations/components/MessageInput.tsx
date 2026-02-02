import { IconSend } from "@tabler/icons-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiSuggestionCard } from "./AiSuggestionCard";
import { AiSuggestionLoading } from "./AiSuggestionLoading";
import { GenerateHint } from "./GenerateHint";
import { SuggestionKeyboardHints } from "./SuggestionKeyboardHints";
import { useAiSuggestion } from "../hooks/useAiSuggestion";

interface MessageInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (content?: string) => void;
	aiSuggestions?: string[];
	isLoadingAiSuggestion?: boolean;
	onRequestAiSuggestion?: () => void;
	onDismissSuggestion?: () => void;
	suggestionsDisabledForSession?: boolean;
	onDisableSuggestionsForSession?: () => void;
	conversationPid?: string | null;
}

export function MessageInput({
	value,
	onChange,
	onSubmit,
	aiSuggestions = [],
	isLoadingAiSuggestion = false,
	onRequestAiSuggestion,
	onDismissSuggestion,
	suggestionsDisabledForSession = false,
	onDisableSuggestionsForSession,
	conversationPid,
}: MessageInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const {
		selectedSuggestionIndex,
		isEditMode,
		hasSuggestions,
		currentSuggestion,
		handleSendSuggestion,
		handleEditSuggestion,
		handleDismissSuggestion,
		handleRegenerate,
		handleNextSuggestion,
		handlePrevSuggestion,
		handleManualGenerate,
		clearEditMode,
	} = useAiSuggestion({
		conversationPid,
		aiSuggestions,
		isLoadingAiSuggestion,
		suggestionsDisabledForSession,
		onRequestAiSuggestion,
		onDismissSuggestion,
		onDisableSuggestionsForSession,
		onChange,
		onSubmit,
		value,
		textareaRef,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (value.trim()) {
			onSubmit();
			clearEditMode();
		}
	};

	const showSuggestionUI = hasSuggestions && !isEditMode;
	const showLoadingUI = isLoadingAiSuggestion && !hasSuggestions;
	const showGenerateHint =
		!hasSuggestions &&
		!isLoadingAiSuggestion &&
		suggestionsDisabledForSession &&
		onRequestAiSuggestion;

	return (
		<div className="border-t shrink-0 bg-background">
			{showLoadingUI && <AiSuggestionLoading />}

			{showSuggestionUI && currentSuggestion && (
				<AiSuggestionCard
					currentSuggestion={currentSuggestion}
					selectedSuggestionIndex={selectedSuggestionIndex}
					totalSuggestions={aiSuggestions.length}
					isLoadingAiSuggestion={isLoadingAiSuggestion}
					onSend={handleSendSuggestion}
					onEdit={handleEditSuggestion}
					onDismiss={handleDismissSuggestion}
					onRegenerate={handleRegenerate}
					onPrev={handlePrevSuggestion}
					onNext={handleNextSuggestion}
				/>
			)}

			<form onSubmit={handleSubmit} className="p-3 md:p-4">
				{showGenerateHint && (
					<GenerateHint onGenerate={handleManualGenerate} />
				)}
				<div
					className={cn(
						"flex gap-2 min-w-0",
						showSuggestionUI ? "items-end" : "items-center",
					)}
				>
					<Textarea
						ref={textareaRef}
						placeholder={
							showSuggestionUI
								? "Or type your own message..."
								: "Type a message..."
						}
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (isEditMode && e.target.value === "") {
								clearEditMode();
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								if (value.trim()) {
									onSubmit();
									clearEditMode();
								}
							}
						}}
						className={cn(
							"flex-1 min-w-0 text-base md:text-sm min-h-10 max-h-32 resize-none",
							showSuggestionUI && "opacity-70 focus:opacity-100",
						)}
						rows={1}
					/>
					<Button
						type="submit"
						size="icon"
						disabled={!value.trim()}
						className="shrink-0 h-9 w-9 md:h-10 md:w-10"
					>
						<IconSend className="h-4 w-4" />
					</Button>
				</div>

				{showSuggestionUI && (
					<SuggestionKeyboardHints
						hasMultipleSuggestions={aiSuggestions.length > 1}
					/>
				)}
			</form>
		</div>
	);
}
