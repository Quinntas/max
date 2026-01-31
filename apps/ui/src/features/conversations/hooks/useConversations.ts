import {
	type ConversationContextType,
	useConversationContext,
} from "../context/ConversationContext";

export function useConversations(): ConversationContextType {
	return useConversationContext();
}
