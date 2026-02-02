import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface GenerateHintProps {
	onGenerate: () => void;
}

export function GenerateHint({ onGenerate }: GenerateHintProps) {
	return (
		<div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
			<span>AI suggestions disabled for this session</span>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onGenerate}
							className="gap-1.5 h-7 text-xs"
						>
							<IconSparkles className="h-3 w-3" />
							Generate
						</Button>
					}
				/>
				<TooltipContent>
					<div className="flex items-center gap-1.5">
						<span>Generate AI suggestion</span>
						<Kbd>Ctrl</Kbd>
						<Kbd>G</Kbd>
					</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
