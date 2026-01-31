import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import ConversationsPage from "./pages/dashboard/conversations/ConversationsPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUp from "./pages/SignUpPage";

const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<TooltipProvider delay={0}>
					<BrowserRouter>
						<Routes>
							<Route index element={<LandingPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/signup" element={<SignUp />} />
							<Route path="/dashboard" element={<DashboardLayout />}>
								<Route index element={<DashboardHome />} />
								<Route path="conversations" element={<ConversationsPage />} />
							</Route>
						</Routes>
					</BrowserRouter>
				</TooltipProvider>
				<Toaster />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
