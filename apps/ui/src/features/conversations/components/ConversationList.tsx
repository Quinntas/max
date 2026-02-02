import { useCallback, useMemo, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useConversations } from "../hooks/useConversations";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
	className?: string;
}

export function ConversationList({ className }: ConversationListProps) {
	const {
		conversations,
		selectedConversationPid,
		setSelectedConversationPid,
		loadMoreConversations,
		hasMoreConversations,
		isLoadingConversations,
		unseenCounts,
	} = useConversations();

	const scrollRef = useRef<HTMLDivElement>(null);

	const sortedConversations = useMemo(() => {
		return [...conversations].sort((a, b) => {
			const aTime = a.conversation.lastMessageAt
				? new Date(a.conversation.lastMessageAt).getTime()
				: 0;
			const bTime = b.conversation.lastMessageAt
				? new Date(b.conversation.lastMessageAt).getTime()
				: 0;
			return bTime - aTime;
		});
	}, [conversations]);

	const handleScroll = useCallback(() => {
		const container = scrollRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

		if (isNearBottom && hasMoreConversations && !isLoadingConversations) {
			loadMoreConversations();
		}
	}, [hasMoreConversations, isLoadingConversations, loadMoreConversations]);

	return (
		<div
			className={cn(
				"flex w-full md:w-80 flex-col border-r bg-muted/10 transition-all min-h-0",
				className,
			)}
		>
			<div className="p-4 space-y-4 shrink-0">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="-ml-1" />
					<h2 className="text-xl font-semibold">Messages</h2>
				</div>
			</div>
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="flex-1 min-h-0 overflow-y-auto"
			>
				<div className="px-2 pb-4">
					{sortedConversations.map((conv) => (
						<ConversationItem
							key={conv.conversation.pid}
							conversation={conv}
							isSelected={selectedConversationPid === conv.conversation.pid}
							onClick={() => setSelectedConversationPid(conv.conversation.pid)}
							unseenCount={unseenCounts[conv.conversation.pid] || 0}
						/>
					))}
					{isLoadingConversations && (
						<div className="flex justify-center py-4">
							<Spinner className="size-5" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
