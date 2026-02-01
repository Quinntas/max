import { IconSend } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
}

export function MessageInput({ value, onChange, onSubmit }: MessageInputProps) {
	return (
		<div className="border-t p-3 md:p-4 shrink-0 bg-background">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit();
				}}
				className="flex items-center gap-2 min-w-0"
			>
				<Input
					placeholder="Type a message..."
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="flex-1 min-w-0 text-base md:text-sm"
				/>
				<Button
					type="submit"
					size="icon"
					disabled={!value}
					className="shrink-0 h-9 w-9 md:h-10 md:w-10"
				>
					<IconSend className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}
