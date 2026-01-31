import { IconCommand } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { error } = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/dashboard",
			});

			if (error) {
				toast.error(error.message || "Invalid email or password");
			} else {
				toast.success("Logged in successfully");
				navigate("/dashboard");
			}
		} catch (err) {
			console.error(err);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<form onSubmit={handleSubmit}>
				<FieldGroup>
					<div className="flex flex-col items-center gap-2 text-center">
						<Link
							to="/"
							className="flex flex-col items-center gap-2 font-medium"
						>
							<div className="flex size-8 items-center justify-center rounded-md">
								<IconCommand className="size-6" />
							</div>
							<span className="sr-only">Acme Inc.</span>
						</Link>
						<h1 className="text-xl font-bold">Welcome back</h1>
						<FieldDescription>
							Don't have an account?{" "}
							<Link to="/signup" className="underline hover:text-primary">
								Sign up
							</Link>
						</FieldDescription>
					</div>
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Field>
					<Field>
						<div className="flex items-center justify-between">
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Link
								to="/forgot-password"
								className="text-sm underline hover:text-primary"
							>
								Forgot password?
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</Field>
					<Field>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</div>
	);
}
