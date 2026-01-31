import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useConversationContext } from "../context/ConversationContext";
import type { Conversation, ConversationStatus } from "../types";

export function useUpdateConversationStatus(): UseMutationResult<
	Conversation,
	Error,
	{ pid: string; status: ConversationStatus },
	{ previousConversations: Conversation[] | undefined }
> {
	const queryClient = useQueryClient();
	const { setConversations } = useConversationContext();

	return useMutation({
		mutationFn: async ({
			pid,
			status,
		}: {
			pid: string;
			status: ConversationStatus;
		}) => {
			const response = await api.conversations({ pid }).patch({
				status: status as never,
			});
			if (response.error) {
				throw new Error(JSON.stringify(response.error.value));
			}
			return response.data as unknown as Conversation;
		},
		onMutate: async ({ pid, status }) => {
			await queryClient.cancelQueries({ queryKey: ["conversations"] });

			const previousConversations = queryClient.getQueryData<Conversation[]>([
				"conversations",
			]);

			const updateList = (old: Conversation[] | undefined) =>
				old?.map((conv) =>
					conv.conversation.pid === pid
						? { ...conv, conversation: { ...conv.conversation, status } }
						: conv,
				);

			queryClient.setQueryData<Conversation[]>(["conversations"], updateList);
			setConversations((old) => updateList(old) || []);

			return { previousConversations };
		},
		onError: (err, _variables, context) => {
			if (context?.previousConversations) {
				queryClient.setQueryData(
					["conversations"],
					context.previousConversations,
				);
				setConversations(context.previousConversations);
			}
			console.error(err);
			toast.error("Failed to update conversation status");
		},
		onSuccess: () => {
			toast.success("Conversation status updated");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});
}

export function useDeleteConversation(): UseMutationResult<
	void,
	Error,
	string,
	unknown
> {
	const queryClient = useQueryClient();
	const { setConversations } = useConversationContext();

	return useMutation({
		mutationFn: async (pid: string) => {
			const response = await api.conversations({ pid }).delete();
			if (response.error) {
				throw new Error(JSON.stringify(response.error.value));
			}
			return response.data as unknown as void;
		},
		onSuccess: (_, pid) => {
			toast.success("Conversation deleted");
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			setConversations((prev) =>
				prev.filter((conv) => conv.conversation.pid !== pid),
			);
		},
		onError: () => {
			toast.error("Failed to delete conversation");
		},
	});
}
