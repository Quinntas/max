import { useCallback, useEffect, useRef, useState } from "react";

interface UseAiSuggestionProps {
	conversationPid?: string | null;
	aiSuggestions: string[];
	isLoadingAiSuggestion: boolean;
	suggestionsDisabledForSession: boolean;
	onRequestAiSuggestion?: () => void;
	onDismissSuggestion?: () => void;
	onDisableSuggestionsForSession?: () => void;
	onChange: (value: string) => void;
	onSubmit: (content?: string) => void;
	value: string;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useAiSuggestion({
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
}: UseAiSuggestionProps) {
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const [isEditMode, setIsEditMode] = useState(false);
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
	}, [currentSuggestion, onChange, textareaRef]);

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

	const clearEditMode = useCallback(() => {
		setIsEditMode(false);
	}, []);

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

	return {
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
	};
}
