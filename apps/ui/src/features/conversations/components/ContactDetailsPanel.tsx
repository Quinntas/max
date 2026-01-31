import {
	IconBrandWhatsapp,
	IconCheck,
	IconCopy,
	IconExternalLink,
	IconFingerprint,
	IconInfoCircle,
	IconMail,
	IconMessage,
	IconNotes,
	IconPhone,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Contact } from "../types";

interface ContactDetailsPanelProps {
	contact: Contact;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface DetailItemProps {
	icon: typeof IconMail;
	label: string;
	value: string | undefined;
	href?: string;
	copyable?: boolean;
}

function DetailItem({
	icon: Icon,
	label,
	value,
	href,
	copyable = true,
}: DetailItemProps) {
	const [copied, setCopied] = useState(false);

	if (!value) return null;

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigator.clipboard.writeText(value);
		setCopied(true);
		toast.success(`${label} copied to clipboard`);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="group relative flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 overflow-hidden">
			<div className="flex items-start gap-3 min-w-0 flex-1">
				<div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors shrink-0">
					<Icon className="size-4" />
				</div>
				<div className="flex flex-col min-w-0 flex-1">
					<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
						{label}
					</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger render={<div className="min-w-0" />}>
								{href ? (
									<a
										href={href}
										className="text-sm font-medium truncate hover:underline hover:text-primary transition-colors flex items-center gap-1"
									>
										{value}
										<IconExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
									</a>
								) : (
									<span className="text-sm font-medium truncate block">
										{value}
									</span>
								)}
							</TooltipTrigger>
							<TooltipContent side="bottom" align="start">
								<p className="max-w-xs break-all">{value}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{copyable && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="size-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
									onClick={handleCopy}
								/>
							}
						>
							{copied ? (
								<IconCheck className="size-4 text-green-500" />
							) : (
								<IconCopy className="size-4" />
							)}
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Copy {label}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
}

export function ContactDetailsPanel({
	contact,
	open,
	onOpenChange,
}: ContactDetailsPanelProps) {
	const [notesCopied, setNotesCopied] = useState(false);

	const initials = contact.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const additionalData = Object.entries(contact.data || {}).filter(
		([key]) => key !== "notes",
	);

	const handleCopyNotes = () => {
		if (!contact.data?.notes) return;
		navigator.clipboard.writeText(contact.data.notes);
		setNotesCopied(true);
		toast.success("Notes copied to clipboard");
		setTimeout(() => setNotesCopied(false), 2000);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="flex flex-col w-full p-0 sm:max-w-md">
				<SheetHeader className="p-6 pb-0">
					<div className="flex flex-col items-center gap-4 text-center">
						<Avatar className="size-24 border-4 border-background shadow-xl">
							<AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1 w-full overflow-hidden">
							<SheetTitle className="text-2xl font-bold truncate">
								{contact.name}
							</SheetTitle>
							<div className="flex items-center justify-center gap-2">
								<Badge variant="secondary" className="font-normal capitalize shrink-0">
									{contact.provider}
								</Badge>
								<SheetDescription className="text-xs truncate">
									Ref: {contact.pid.slice(0, 8)}
								</SheetDescription>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-3 pt-6">
						<Button
							variant="outline"
							className="flex-1"
							render={
								<a
									href={`mailto:${contact.email}`}
									className="flex items-center justify-center gap-2"
								/>
							}
						>
							<IconMail className="size-4" />
							<span>Email</span>
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							render={
								<a
									href={`tel:${contact.phone}`}
									className="flex items-center justify-center gap-2"
								/>
							}
						>
							<IconPhone className="size-4" />
							<span>Call</span>
						</Button>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 px-6">
					<div className="py-6 space-y-6">
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<IconMessage className="size-4 text-muted-foreground" />
								<h4 className="text-sm font-semibold">Contact Information</h4>
							</div>
							<div className="grid gap-2 overflow-hidden">
								<DetailItem
									icon={IconMail}
									label="Email Address"
									value={contact.email}
									href={contact.email ? `mailto:${contact.email}` : undefined}
								/>

								<DetailItem
									icon={IconPhone}
									label="Phone Number"
									value={contact.phone}
									href={contact.phone ? `tel:${contact.phone}` : undefined}
								/>

								<DetailItem
									icon={IconBrandWhatsapp}
									label="Provider"
									value={contact.provider}
									copyable={false}
								/>

								<DetailItem
									icon={IconFingerprint}
									label="Unique Identifier"
									value={contact.pid}
								/>
							</div>
						</div>

						{additionalData.length > 0 && (
							<>
								<Separator className="bg-muted/50" />
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<IconInfoCircle className="size-4 text-muted-foreground" />
										<h4 className="text-sm font-semibold">Additional Data</h4>
									</div>
									<div className="grid gap-2 overflow-hidden">
										{additionalData.map(([key, value]) => (
											<DetailItem
												key={key}
												icon={IconInfoCircle}
												label={key.replace(/_/g, " ")}
												value={String(value)}
											/>
										))}
									</div>
								</div>
							</>
						)}

						<Separator className="bg-muted/50" />

						<div className="space-y-3 pb-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-muted-foreground">
									<IconNotes className="size-4" />
									<h4 className="text-sm font-semibold text-foreground">
										Internal Notes
									</h4>
								</div>
								{contact.data?.notes && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
														onClick={handleCopyNotes}
													/>
												}
											>
												{notesCopied ? (
													<IconCheck className="size-4 text-green-500" />
												) : (
													<IconCopy className="size-4" />
												)}
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">Copy Notes</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							</div>
							<div className="rounded-xl border bg-muted/30 p-4">
								{contact.data?.notes ? (
									<p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
										{contact.data.notes}
									</p>
								) : (
									<p className="text-sm italic text-muted-foreground/60 text-center py-4">
										No notes available for this contact.
									</p>
								)}
							</div>
						</div>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
