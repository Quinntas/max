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

export function SignupForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { error } = await authClient.signUp.email({
				email,
				password,
				name,
				callbackURL: "/dashboard",
			});

			if (error) {
				toast.error(error.message || "Something went wrong");
			} else {
				toast.success("Account created successfully");
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
						<h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
						<FieldDescription>
							Already have an account?{" "}
							<Link to="/login" className="underline hover:text-primary">
								Sign in
							</Link>
						</FieldDescription>
					</div>
					<Field>
						<FieldLabel htmlFor="name">Name</FieldLabel>
						<Input
							id="name"
							type="text"
							placeholder="John Doe"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</Field>
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
						<FieldLabel htmlFor="password">Password</FieldLabel>
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
							{loading ? "Creating Account..." : "Create Account"}
						</Button>
					</Field>
				</FieldGroup>
			</form>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our{" "}
				<Link to="/terms" className="underline hover:text-primary">
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link to="/privacy" className="underline hover:text-primary">
					Privacy Policy
				</Link>
				.
			</FieldDescription>
		</div>
	);
}
