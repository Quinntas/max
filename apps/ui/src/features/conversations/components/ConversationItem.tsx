import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";

interface ConversationItemProps {
	conversation: Conversation;
	isSelected: boolean;
	onClick: () => void;
	unseenCount?: number;
}

export function ConversationItem({
	conversation,
	isSelected,
	onClick,
	unseenCount = 0,
}: ConversationItemProps) {
	const { contact, conversation: meta, lastMessage} = conversation;

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
				"flex w-full flex-col gap-1 my-1 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
				isSelected && "bg-muted",
			)}
		>
			<div className="flex w-full items-start gap-3">
				<div className="relative">
					<Avatar className="size-9">
						<AvatarFallback>{contact.name ? contact.name[0] : contact.email[0]}</AvatarFallback>
					</Avatar>
					{unseenCount > 0 && (
						<span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
							{unseenCount > 99 ? "99+" : unseenCount}
						</span>
					)}
				</div>
				<div className="flex flex-col grow overflow-hidden">
					<div className="flex w-full items-center justify-between">
						<span className="font-medium truncate max-w-[calc(100%-60px)]">
							{contact.name || contact.email}
						</span>
						<span className="text-[10px] text-muted-foreground whitespace-nowrap">
							{timeDisplay}
						</span>
					</div>
					<div className="flex w-full items-center justify-between mt-1">
						<p className="text-sm text-muted-foreground truncate max-w-[calc(100%-60px)]">
							{lastMessage?.content || "No messages yet."}
						</p>
						{meta.status && (
							<Badge
								variant="outline"
								className={cn(
									"text-[10px] h-4 px-1 shrink-0",
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
						)}
					</div>
				</div>
			</div>
		</button>
	);
}
