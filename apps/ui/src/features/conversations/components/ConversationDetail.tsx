import { useState } from "react";
import { cn } from "@/lib/utils";
import { useConversations } from "../hooks/useConversations";
import { ConversationHeader } from "./ConversationHeader";
import { EmptyConversationState } from "./EmptyConversationState";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

export function ConversationDetail() {
	const {
		selectedConversation,
		messages,
		selectedConversationPid,
		setSelectedConversationPid,
		sendMessage,
		aiSuggestions,
		isLoadingAiSuggestion,
		requestAiSuggestion,
		dismissAiSuggestion,
	} = useConversations();

	const [messageInput, setMessageInput] = useState("");
	const [suggestionsDisabledForSession, setSuggestionsDisabledForSession] = useState(false);

	const handleSendMessage = (content?: string) => {
		const messageToSend = content ?? messageInput;
		if (!messageToSend.trim()) return;
		sendMessage(messageToSend);
		setMessageInput("");
		dismissAiSuggestion();
	};

	return (
		<div
			className={cn(
				"flex flex-1 flex-col bg-background transition-all min-h-0 overflow-hidden w-full",
				selectedConversationPid === null ? "hidden md:flex" : "flex",
			)}
		>
			{selectedConversation ? (
				<>
					<ConversationHeader
						conversation={selectedConversation}
						onBack={() => setSelectedConversationPid(null)}
					/>
					<MessageList messages={messages} />
					<MessageInput
						value={messageInput}
						onChange={setMessageInput}
						onSubmit={handleSendMessage}
						aiSuggestions={aiSuggestions}
						isLoadingAiSuggestion={isLoadingAiSuggestion}
						onRequestAiSuggestion={requestAiSuggestion}
						onDismissSuggestion={dismissAiSuggestion}
						suggestionsDisabledForSession={suggestionsDisabledForSession}
						onDisableSuggestionsForSession={() => setSuggestionsDisabledForSession(true)}
						conversationPid={selectedConversationPid}
					/>
				</>
			) : (
				<EmptyConversationState />
			)}
		</div>
	);
}
