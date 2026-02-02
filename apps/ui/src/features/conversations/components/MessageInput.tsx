import {
	IconChevronLeft,
	IconChevronRight,
	IconEdit,
	IconRefresh,
	IconSend,
	IconSparkles,
	IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const [isEditMode, setIsEditMode] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasTriggeredRef = useRef(false);

	const hasSuggestions = aiSuggestions.length > 0;
	const currentSuggestion = hasSuggestions
		? aiSuggestions[selectedSuggestionIndex]
		: null;

	useEffect(() => {
		hasTriggeredRef.current = false;
		setSelectedSuggestionIndex(0);
		setIsEditMode(false);
	}, [conversationPid]);

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}

		if (
			value === "" &&
			!isLoadingAiSuggestion &&
			!hasSuggestions &&
			!hasTriggeredRef.current &&
			!suggestionsDisabledForSession &&
			onRequestAiSuggestion
		) {
			debounceRef.current = setTimeout(() => {
				hasTriggeredRef.current = true;
				onRequestAiSuggestion();
			}, 1000);
		}

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [
		value,
		isLoadingAiSuggestion,
		hasSuggestions,
		suggestionsDisabledForSession,
		onRequestAiSuggestion,
	]);

	useEffect(() => {
		if (!hasSuggestions && !isLoadingAiSuggestion) {
			const timeout = setTimeout(() => {
				hasTriggeredRef.current = false;
			}, 2000);
			return () => clearTimeout(timeout);
		}
	}, [hasSuggestions, isLoadingAiSuggestion]);

	const handleSendSuggestion = useCallback(() => {
		if (currentSuggestion) {
			onSubmit(currentSuggestion);
		}
	}, [currentSuggestion, onSubmit]);

	const handleEditSuggestion = useCallback(() => {
		if (currentSuggestion) {
			onChange(currentSuggestion);
			setIsEditMode(true);
			setTimeout(() => {
				textareaRef.current?.focus();
				textareaRef.current?.setSelectionRange(
					currentSuggestion.length,
					currentSuggestion.length,
				);
			}, 0);
		}
	}, [currentSuggestion, onChange]);

	const handleDismissSuggestion = useCallback(() => {
		setSelectedSuggestionIndex(0);
		setIsEditMode(false);
		hasTriggeredRef.current = true;
		onDismissSuggestion?.();
		onDisableSuggestionsForSession?.();
	}, [onDismissSuggestion, onDisableSuggestionsForSession]);

	const handleRegenerate = useCallback(() => {
		if (onRequestAiSuggestion && !isLoadingAiSuggestion) {
			setSelectedSuggestionIndex(0);
			onRequestAiSuggestion();
		}
	}, [onRequestAiSuggestion, isLoadingAiSuggestion]);

	const handleNextSuggestion = useCallback(() => {
		if (hasSuggestions) {
			setSelectedSuggestionIndex((prev) =>
				prev < aiSuggestions.length - 1 ? prev + 1 : 0,
			);
		}
	}, [hasSuggestions, aiSuggestions.length]);

	const handlePrevSuggestion = useCallback(() => {
		if (hasSuggestions) {
			setSelectedSuggestionIndex((prev) =>
				prev > 0 ? prev - 1 : aiSuggestions.length - 1,
			);
		}
	}, [hasSuggestions, aiSuggestions.length]);

	const handleManualGenerate = useCallback(() => {
		if (onRequestAiSuggestion && !isLoadingAiSuggestion && !hasSuggestions) {
			onRequestAiSuggestion();
		}
	}, [onRequestAiSuggestion, isLoadingAiSuggestion, hasSuggestions]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "g" &&
				(e.metaKey || e.ctrlKey) &&
				!hasSuggestions &&
				!isLoadingAiSuggestion
			) {
				e.preventDefault();
				e.stopPropagation();
				handleManualGenerate();
				return;
			}

			if (e.key === "d" && (e.metaKey || e.ctrlKey) && hasSuggestions) {
				e.preventDefault();
				e.stopPropagation();
				handleDismissSuggestion();
				return;
			}

			if (
				e.key === "r" &&
				(e.metaKey || e.ctrlKey) &&
				(hasSuggestions || isLoadingAiSuggestion)
			) {
				e.preventDefault();
				e.stopPropagation();
				handleRegenerate();
				return;
			}

			if (!hasSuggestions || isEditMode) return;

			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				e.preventDefault();
				if (e.key === "ArrowUp") {
					handlePrevSuggestion();
				} else {
					handleNextSuggestion();
				}
			} else if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSendSuggestion();
			} else if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleEditSuggestion();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		hasSuggestions,
		isEditMode,
		isLoadingAiSuggestion,
		handlePrevSuggestion,
		handleNextSuggestion,
		handleSendSuggestion,
		handleEditSuggestion,
		handleDismissSuggestion,
		handleRegenerate,
		handleManualGenerate,
	]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (value.trim()) {
			onSubmit();
			setIsEditMode(false);
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
			{showLoadingUI && (
				<div className="px-3 md:px-4 pt-3 md:pt-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
						<IconSparkles className="h-4 w-4 text-primary" />
						<span>Generating suggestions...</span>
					</div>
				</div>
			)}

			{showSuggestionUI && (
				<div className="px-3 md:px-4 pt-3 md:pt-4">
					<div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
						<div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/5">
							<div className="flex items-center gap-2">
								<IconSparkles className="h-4 w-4 text-primary" />
								<span className="text-xs font-medium text-primary">
									AI Suggestion
								</span>
								{aiSuggestions.length > 1 && (
									<span className="text-xs text-muted-foreground">
										{selectedSuggestionIndex + 1} of {aiSuggestions.length}
									</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								{aiSuggestions.length > 1 && (
									<div className="flex items-center gap-0.5 mr-2">
										<Button
											type="button"
											variant="ghost"
											onClick={handlePrevSuggestion}
											className="text-muted-foreground hover:text-foreground"
										>
											<span className="sr-only">Previous</span>
											<IconChevronLeft className="h-3 w-3" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											onClick={handleNextSuggestion}
											className="text-muted-foreground hover:text-foreground"
										>
											<span className="sr-only">Next</span>
											<IconChevronRight className="h-3 w-3" />
										</Button>
									</div>
								)}
								<Button
									type="button"
									variant="ghost"
									onClick={handleDismissSuggestion}
									className="text-muted-foreground hover:text-foreground"
								>
									<IconX className="h-3.5 w-3.5" />
									<span className="sr-only">Dismiss</span>
								</Button>
							</div>
						</div>

						<div className="px-3 py-3">
							<p className="text-sm text-foreground leading-relaxed">
								{currentSuggestion}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-primary/10 bg-background/50">
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											size="sm"
											onClick={handleSendSuggestion}
											className="gap-1.5"
										/>
									}
								>
									<IconSend className="h-3.5 w-3.5" />
									Send as-is
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex items-center gap-1.5">
										<span>Send this message</span>
										<Kbd>Enter</Kbd>
									</div>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleEditSuggestion}
											className="gap-1.5"
										/>
									}
								>
									<IconEdit className="h-3.5 w-3.5" />
									Edit & Send
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex items-center gap-1.5">
										<span>Edit before sending</span>
										<Kbd>Ctrl</Kbd>
										<Kbd>E</Kbd>
									</div>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleRegenerate}
											disabled={isLoadingAiSuggestion}
											className="gap-1.5"
										/>
									}
								>
									<IconRefresh
										className={cn(
											"h-3.5 w-3.5",
											isLoadingAiSuggestion && "animate-spin",
										)}
									/>
									Regenerate
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex items-center gap-1.5">
										<span>Generate new suggestions</span>
										<Kbd>Ctrl</Kbd>
										<Kbd>R</Kbd>
									</div>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleDismissSuggestion}
											className="text-muted-foreground"
										/>
									}
								>
									Ignore
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex items-center gap-1.5">
										<span>Dismiss suggestion</span>
										<Kbd>Ctrl</Kbd>
										<Kbd>D</Kbd>
									</div>
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={handleSubmit} className="p-3 md:p-4">
				{showGenerateHint && (
					<div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
						<span>AI suggestions disabled for this session</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleManualGenerate}
										className="gap-1.5 h-7 text-xs"
									/>
								}
							>
								<IconSparkles className="h-3 w-3" />
								Generate
							</TooltipTrigger>
							<TooltipContent>
								<div className="flex items-center gap-1.5">
									<span>Generate AI suggestion</span>
									<Kbd>Ctrl</Kbd>
									<Kbd>G</Kbd>
								</div>
							</TooltipContent>
						</Tooltip>
					</div>
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
								setIsEditMode(false);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								if (value.trim()) {
									onSubmit();
									setIsEditMode(false);
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
						{aiSuggestions.length > 1 && (
							<span className="flex items-center gap-1">
								<Kbd>↑</Kbd>
								<Kbd>↓</Kbd> to navigate
							</span>
						)}
					</div>
				)}
			</form>
		</div>
	);
}
