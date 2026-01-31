import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";

interface ConversationItemProps {
	conversation: Conversation;
	isSelected: boolean;
	onClick: () => void;
}

export function ConversationItem({
	conversation,
	isSelected,
	onClick,
}: ConversationItemProps) {
	const { contact, conversation: meta } = conversation;

	let timeDisplay = "";
	if (meta.lastMessageAt) {
		try {
			timeDisplay = formatDistanceToNow(new Date(meta.lastMessageAt), {
				addSuffix: true,
			});
		} catch {
			timeDisplay = String(meta.lastMessageAt);
		}
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full flex-col gap-1 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
				isSelected && "bg-muted",
			)}
		>
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-3">
					<Avatar className="size-9">
						<AvatarFallback>{contact.name[0]}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col overflow-hidden">
						<span className="text-sm font-medium">{contact.name}</span>
						<span className="text-xs text-muted-foreground truncate max-w-[140px]">
							{contact.email}
						</span>
					</div>
				</div>
				<div className="flex flex-col items-end gap-1 shrink-0">
					<span className="text-[10px] text-muted-foreground whitespace-nowrap">
						{timeDisplay}
					</span>
				</div>
			</div>
			<div className="mt-1 flex gap-1">
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] h-4 px-1",
						meta.status === "NEW" &&
							"bg-blue-500/10 text-blue-500 border-blue-500/20",
						meta.status === "IN_PROGRESS" &&
							"bg-orange-500/10 text-orange-500 border-orange-500/20",
						meta.status === "RESOLVED" &&
							"bg-green-500/10 text-green-500 border-green-500/20",
					)}
				>
					{meta.status.replace("_", " ")}
				</Badge>
			</div>
		</button>
	);
}
