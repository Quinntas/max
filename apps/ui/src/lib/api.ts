import { treaty } from "@elysiajs/eden";
import type { App } from "@max-assessment/contracts";

export const api: ReturnType<typeof treaty<App>> = treaty<App>(
	`${import.meta.env.VITE_API_URL}/`,
	{
		fetch: {
			credentials: "include",
		},
	},
);
