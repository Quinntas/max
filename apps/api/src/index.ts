import { app } from "./start/app";
import { env } from "./utils/env";

app.listen({ port: Number(env.PORT), hostname: "0.0.0.0" });

export type App = typeof app;
