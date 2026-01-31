import { ConversationDetail } from "@/features/conversations/components/ConversationDetail";
import { ConversationList } from "@/features/conversations/components/ConversationList";
import { ConversationProvider } from "@/features/conversations/context/ConversationContext";
import { useConversations } from "@/features/conversations/hooks/useConversations";

function ConversationsLayout() {
	const { selectedConversationPid } = useConversations();

	return (
		<div className="flex flex-1 overflow-hidden rounded-xl border bg-background shadow-sm h-full min-h-0">
			<ConversationList
				className={selectedConversationPid !== null ? "hidden md:flex" : "flex"}
			/>
			<ConversationDetail />
		</div>
	);
}

export default function ConversationsPage() {
	return (
		<ConversationProvider>
			<ConversationsLayout />
		</ConversationProvider>
	);
}
