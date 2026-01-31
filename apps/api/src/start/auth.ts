import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { env } from "../utils/env";
import { db } from "./drizzle";
import * as schema from "./schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema,
	}),
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.FRONTEND_URL],
	basePath: "/api",
	emailAndPassword: {
		enabled: true,
	},
	plugins: [openAPI()],
});
