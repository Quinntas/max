import {
	IconChevronLeft,
	IconChevronRight,
	IconEdit,
	IconRefresh,
	IconSend,
	IconSparkles,
	IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AiSuggestionCardProps {
	currentSuggestion: string;
	selectedSuggestionIndex: number;
	totalSuggestions: number;
	isLoadingAiSuggestion: boolean;
	onSend: () => void;
	onEdit: () => void;
	onDismiss: () => void;
	onRegenerate: () => void;
	onPrev: () => void;
	onNext: () => void;
}

export function AiSuggestionCard({
	currentSuggestion,
	selectedSuggestionIndex,
	totalSuggestions,
	isLoadingAiSuggestion,
	onSend,
	onEdit,
	onDismiss,
	onRegenerate,
	onPrev,
	onNext,
}: AiSuggestionCardProps) {
	const hasMultiple = totalSuggestions > 1;

	return (
		<div className="px-3 md:px-4 pt-3 md:pt-4">
			<div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
				<div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/5">
					<div className="flex items-center gap-2">
						<IconSparkles className="h-4 w-4 text-primary" />
						<span className="text-xs font-medium text-primary">
							AI Suggestion
						</span>
						{hasMultiple && (
							<span className="text-xs text-muted-foreground">
								{selectedSuggestionIndex + 1} of {totalSuggestions}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1">
						{hasMultiple && (
							<div className="flex items-center gap-0.5 mr-2">
								<Button
									type="button"
									variant="ghost"
									onClick={onPrev}
									className="text-muted-foreground hover:text-foreground"
								>
									<span className="sr-only">Previous</span>
									<IconChevronLeft className="h-3 w-3" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									onClick={onNext}
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
							onClick={onDismiss}
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
									onClick={onSend}
									className="gap-1.5"
								>
									<IconSend className="h-3.5 w-3.5" />
									Send as-is
								</Button>
							}
						/>
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
									onClick={onEdit}
									className="gap-1.5"
								>
									<IconEdit className="h-3.5 w-3.5" />
									Edit & Send
								</Button>
							}
						/>
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
									onClick={onRegenerate}
									disabled={isLoadingAiSuggestion}
									className="gap-1.5"
								>
									<IconRefresh
										className={cn(
											"h-3.5 w-3.5",
											isLoadingAiSuggestion && "animate-spin",
										)}
									/>
									Regenerate
								</Button>
							}
						/>
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
									onClick={onDismiss}
									className="text-muted-foreground"
								>
									Ignore
								</Button>
							}
						/>
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
	);
}
