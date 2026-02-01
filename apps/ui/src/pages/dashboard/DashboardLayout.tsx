import { Navigate, Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/features/auth";
import { AppSidebar } from "@/features/dashboard/components/AppSidebar";

function DashboardContent() {
	const { user, isPending } = useAuth();

	if (isPending) {
		return (
			<div className="flex h-svh items-center justify-center">
				<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="flex flex-col h-svh overflow-hidden">
				<main className="flex-1 min-h-0 flex flex-col p-2 md:p-4">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default function DashboardLayout() {
	return (
		<AuthProvider>
			<DashboardContent />
		</AuthProvider>
	);
}
