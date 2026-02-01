import { useCallback, useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useConversationContext } from "../context/ConversationContext";
import type { Message } from "../types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
	messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
	const { loadMoreMessages, hasMoreMessages, isLoadingMessages } =
		useConversationContext();
	const scrollRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const prevMessagesLengthRef = useRef(0);
	const isInitialLoadRef = useRef(true);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
	}, []);

	useEffect(() => {
		const isNewMessage = messages.length === prevMessagesLengthRef.current + 1;
		const isInitialLoad = isInitialLoadRef.current && messages.length > 0;

		if (isInitialLoad || isNewMessage) {
			scrollToBottom();
			isInitialLoadRef.current = false;
		}

		prevMessagesLengthRef.current = messages.length;
	}, [messages, scrollToBottom]);

	useEffect(() => {
		isInitialLoadRef.current = true;
		prevMessagesLengthRef.current = 0;
	}, []);

	const handleScroll = useCallback(() => {
		const container = scrollRef.current;
		if (!container) return;

		if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMessages) {
			const scrollHeightBefore = container.scrollHeight;

			loadMoreMessages();

			requestAnimationFrame(() => {
				const scrollHeightAfter = container.scrollHeight;
				container.scrollTop = scrollHeightAfter - scrollHeightBefore;
			});
		}
	}, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);

	return (
		<div
			ref={scrollRef}
			onScroll={handleScroll}
			className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 md:px-6 md:py-4 min-h-0 flex flex-col"
		>
			{isLoadingMessages && hasMoreMessages && (
				<div className="flex justify-center py-2">
					<Spinner className="h-5 w-5" />
				</div>
			)}
			<div className="flex-1" />
			<div className="space-y-3 md:space-y-4 w-full">
				{messages.map((msg) => (
					<MessageBubble key={msg.pid} message={msg} />
				))}
			</div>
			<div ref={messagesEndRef} />
		</div>
	);
}
