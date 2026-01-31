import { IconDotsVertical } from "@tabler/icons-react";

export function EmptyConversationState() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center text-center p-8">
			<div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
				<IconDotsVertical className="size-6 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold">No conversation selected</h3>
			<p className="text-sm text-muted-foreground max-w-[250px]">
				Choose a conversation from the sidebar to start messaging.
			</p>
		</div>
	);
}
