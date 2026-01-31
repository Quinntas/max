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
		<div className="border-t p-4 shrink-0">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit();
				}}
				className="flex items-center gap-2"
			>
				<Input
					placeholder="Type a message..."
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="flex-1"
				/>
				<Button type="submit" size="icon" disabled={!value}>
					<IconSend className="size-4" />
				</Button>
			</form>
		</div>
	);
}
