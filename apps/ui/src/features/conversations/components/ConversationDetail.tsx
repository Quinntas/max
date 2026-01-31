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
	} = useConversations();

	const [messageInput, setMessageInput] = useState("");

	const handleSendMessage = () => {
		sendMessage(messageInput);
		setMessageInput("");
	};

	return (
		<div
			className={cn(
				"flex flex-1 flex-col bg-background transition-all min-h-0",
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
					/>
				</>
			) : (
				<EmptyConversationState />
			)}
		</div>
	);
}
