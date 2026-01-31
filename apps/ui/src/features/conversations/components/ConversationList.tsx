import { IconFilter, IconSearch } from "@tabler/icons-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	} = useConversations();

	const scrollRef = useRef<HTMLDivElement>(null);

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
					<div className="ml-auto">
						<Button variant="ghost" size="icon">
							<IconFilter className="size-4" />
						</Button>
					</div>
				</div>
				<div className="relative">
					<IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Search conversations..."
						className="pl-9 bg-background"
					/>
				</div>
			</div>
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="flex-1 min-h-0 overflow-y-auto"
			>
				<div className="px-2 pb-4">
					{conversations.map((conv) => (
						<ConversationItem
							key={conv.conversation.pid}
							conversation={conv}
							isSelected={selectedConversationPid === conv.conversation.pid}
							onClick={() => setSelectedConversationPid(conv.conversation.pid)}
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
