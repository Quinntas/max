import {
	IconArrowLeft,
	IconCircle,
	IconCircleCheck,
	IconDotsVertical,
	IconLoader,
	IconTrash,
	IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	useDeleteConversation,
	useUpdateConversationStatus,
} from "../hooks/useConversationMutations";
import type { Conversation, ConversationStatus } from "../types";
import { ContactDetailsPanel } from "./ContactDetailsPanel";

interface ConversationHeaderProps {
	conversation: Conversation;
	onBack: () => void;
}

const STATUS_CONFIG: Record<
	ConversationStatus,
	{ label: string; color: string }
> = {
	NEW: { label: "New", color: "text-blue-500" },
	IN_PROGRESS: { label: "In Progress", color: "text-yellow-500" },
	RESOLVED: { label: "Resolved", color: "text-green-500" },
};

function StatusIcon({
	status,
	className,
}: { status: ConversationStatus; className?: string }) {
	switch (status) {
		case "NEW":
			return <IconCircle className={className} />;
		case "IN_PROGRESS":
			return <IconLoader className={className} />;
		case "RESOLVED":
			return <IconCircleCheck className={className} />;
	}
}

export function ConversationHeader({
	conversation,
	onBack,
}: ConversationHeaderProps) {
	const { contact } = conversation;
	const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

	const updateStatus = useUpdateConversationStatus();
	const deleteConversation = useDeleteConversation();

	const currentStatus =
		(conversation.conversation.status as ConversationStatus) || "NEW";
	const statusConfig = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.NEW;

	const handleStatusChange = (status: ConversationStatus) => {
		updateStatus.mutate({
			pid: conversation.conversation.pid,
			status,
		});
	};

	const handleDelete = () => {
		if (window.confirm("Are you sure you want to delete this conversation?")) {
			deleteConversation.mutate(conversation.conversation.pid);
		}
	};

	return (
		<>
			<div className="flex items-center justify-between border-b px-4 py-3 md:px-6 shrink-0">
				<div className="flex items-center gap-3 overflow-hidden">
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden -ml-2"
						onClick={onBack}
					>
						<IconArrowLeft className="size-5" />
					</Button>
					<Avatar className="size-8 md:size-10 shrink-0">
						<AvatarFallback>{contact.name[0]}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col overflow-hidden">
						<button
							type="button"
							onClick={() => setIsContactPanelOpen(true)}
							className="text-sm font-semibold truncate text-left hover:underline cursor-pointer"
						>
							{contact.name}
						</button>
						<p className="text-xs text-muted-foreground truncate hidden sm:block">
							{contact.email}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1 md:gap-2">
					<div className="hidden sm:flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Button variant="outline" size="sm" className="gap-2" />}
							>
								<StatusIcon
									status={currentStatus}
									className={`size-4 ${statusConfig.color}`}
								/>
								{statusConfig.label}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{(Object.keys(STATUS_CONFIG) as ConversationStatus[]).map(
									(status) => (
										<DropdownMenuItem
											key={status}
											onClick={() => handleStatusChange(status)}
										>
											<StatusIcon
												status={status}
												className={`mr-2 size-4 ${STATUS_CONFIG[status].color}`}
											/>
											{STATUS_CONFIG[status].label}
										</DropdownMenuItem>
									),
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<Separator
						orientation="vertical"
						className="h-4 mx-1 hidden sm:block"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
							<IconDotsVertical className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								className="sm:hidden"
								onClick={() => handleStatusChange("NEW")}
							>
								<IconCircle className="mr-2 size-4 text-blue-500" />
								Set as New
							</DropdownMenuItem>
							<DropdownMenuItem
								className="sm:hidden"
								onClick={() => handleStatusChange("IN_PROGRESS")}
							>
								<IconLoader className="mr-2 size-4 text-yellow-500" />
								Set as In Progress
							</DropdownMenuItem>
							<DropdownMenuItem
								className="sm:hidden"
								onClick={() => handleStatusChange("RESOLVED")}
							>
								<IconCircleCheck className="mr-2 size-4 text-green-500" />
								Set as Resolved
							</DropdownMenuItem>
							<DropdownMenuSeparator className="sm:hidden" />
							<DropdownMenuItem onClick={() => setIsContactPanelOpen(true)}>
								<IconUser className="mr-2 size-4" />
								View Contact
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onClick={handleDelete}>
								<IconTrash className="mr-2 size-4" />
								Delete Conversation
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<ContactDetailsPanel
				contact={contact}
				open={isContactPanelOpen}
				onOpenChange={setIsContactPanelOpen}
			/>
		</>
	);
}
