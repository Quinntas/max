import { Redis } from "../infra/redis";
import { env } from "../utils/env";
import { logger } from "./logger";

export const cache = new Redis(
	`redis://:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
	logger,
);
