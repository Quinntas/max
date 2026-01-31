import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth } from "../auth";

async function getBetterAuthOpenAPISchema() {
	const schema = await auth.api.generateOpenAPISchema();

	const prefixedPaths: Record<string, unknown> = {};
	for (const [path, pathItem] of Object.entries(schema.paths || {})) {
		const prefixedPath = `/auth/api${path}`;

		const taggedPathItem: Record<string, unknown> = {};
		for (const [method, operation] of Object.entries(
			pathItem as Record<string, unknown>,
		)) {
			if (typeof operation === "object" && operation !== null) {
				taggedPathItem[method] = {
					...(operation as Record<string, unknown>),
					tags: ["Auth"],
				};
			} else {
				taggedPathItem[method] = operation;
			}
		}

		prefixedPaths[prefixedPath] = taggedPathItem;
	}

	return {
		paths: prefixedPaths,
		components: schema.components || {},
	};
}

export const openApiPlugin = new Elysia({ name: "openapi-plugin" }).use(
	await (async () => {
		const betterAuthSchema = await getBetterAuthOpenAPISchema();

		return openapi({
			path: "/docs",
			scalar: {
				spec: {
					url: "/docs/json",
				},
			},
			documentation: {
				info: {
					title: "Elysia API",
					version: "1.0.0",
					description: "API documentation",
				},
				paths: betterAuthSchema.paths as Record<
					string,
					Record<string, unknown>
				>,
				components: betterAuthSchema.components as Record<string, unknown>,
			},
		});
	})(),
);
