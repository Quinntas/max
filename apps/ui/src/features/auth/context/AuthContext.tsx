import { createContext, type ReactNode, useContext } from "react";
import { authClient } from "@/lib/auth";

type Session = typeof authClient.$Infer.Session.session;
type User = typeof authClient.$Infer.Session.user;

export interface AuthContextType {
	session: Session | null;
	user: User | null;
	isPending: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data, isPending } = authClient.useSession();

	const signOut = async () => {
		await authClient.signOut();
	};

	const value: AuthContextType = {
		session: data?.session ?? null,
		user: data?.user ?? null,
		isPending,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
