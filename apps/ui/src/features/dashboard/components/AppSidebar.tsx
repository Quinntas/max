import {
	IconCommand,
	IconDeviceDesktop,
	IconLayoutDashboard,
	IconLogout,
	IconMessages,
	IconMoon,
	IconSun,
	IconUser,
} from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth";

const items = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: IconLayoutDashboard,
	},
	{
		title: "Conversations",
		url: "/dashboard/conversations",
		icon: IconMessages,
	},
];

export function AppSidebar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, signOut } = useAuth();
	const { setTheme } = useTheme();

	const handleLogout = async () => {
		try {
			await signOut();
			toast.success("Logged out successfully");
			navigate("/login");
		} catch (err) {
			toast.error("Failed to sign out");
		}
	};

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<IconCommand className="size-5" />
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-semibold">Acme Inc.</span>
								<span className="text-xs text-muted-foreground">v1.0.0</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										isActive={location.pathname === item.url}
										render={<Link to={item.url} />}
									>
										<item.icon className="size-4" />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									/>
								}
							>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
									<IconUser className="size-5" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										{user?.name || "User"}
									</span>
									<span className="truncate text-xs">
										{user?.email || "user@example.com"}
									</span>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="bottom"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuItem onClick={() => setTheme("light")}>
									<IconSun className="mr-2 size-4" />
									Light Mode
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setTheme("dark")}>
									<IconMoon className="mr-2 size-4" />
									Dark Mode
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setTheme("system")}>
									<IconDeviceDesktop className="mr-2 size-4" />
									System
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout}>
									<IconLogout className="mr-2 size-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
