import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardHome() {
	return (
		<div className="flex flex-col gap-4 h-full">
			<header className="flex items-center gap-2 shrink-0">
				<SidebarTrigger className="-ml-1" />
				<h1 className="text-2xl font-bold">Dashboard Home</h1>
			</header>
			<div className="flex flex-1 flex-col gap-4 min-h-0 overflow-auto">
				<p className="text-muted-foreground shrink-0">
					Welcome back! Here is an overview of your workspace.
				</p>
				<div className="grid auto-rows-min gap-4 md:grid-cols-3 shrink-0">
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
				</div>
				<div className="min-h-[400px] flex-1 rounded-xl bg-muted/50" />
			</div>
		</div>
	);
}
