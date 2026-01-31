import { IconCheck } from "@tabler/icons-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message } from "../types";

interface MessageBubbleProps {
	message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
	const isMe = message.senderType !== "COSTUMER";

	let timeDisplay = "";
	try {
		timeDisplay = format(new Date(message.createdAt), "h:mm a");
	} catch {
		timeDisplay = String(message.createdAt);
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-1 w-max max-w-[85%] md:max-w-[70%]",
				isMe ? "ml-auto items-end" : "items-start",
			)}
		>
			<div
				className={cn(
					"rounded-lg px-3 py-2 text-sm",
					isMe ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				<div className="flex flex-col gap-1">
					{isMe && (
						<span className="text-[10px] opacity-70 font-bold uppercase block text-right">
							{message.senderType.replace("_", " ")}
						</span>
					)}
					<span>{message.content}</span>
				</div>
			</div>
			<div
				className={cn(
					"flex items-center gap-1 text-[10px] text-muted-foreground",
					isMe && "flex-row-reverse",
				)}
			>
				<span>{timeDisplay}</span>
				{isMe && <IconCheck className="size-3" />}
			</div>
		</div>
	);
}
