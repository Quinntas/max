import { Redis as IORedis } from "ioredis";
import type { Logger } from "pino";
import { Cache, type CacheTypes } from "../contracts/cache";

export class Redis extends Cache {
	private readonly client: IORedis;
	private subClient?: IORedis;
	private readonly callbacks: Map<string, Set<(message: string) => void>> =
		new Map();

	constructor(
		url: string,
		private readonly logger: Logger,
	) {
		super();
		this.client = new IORedis(url);

		this.client.on("error", (err) => {
			this.logger.error({
				type: "redis-client-error",
				err,
			});
		});
	}

	get(key: string): Promise<string | null> {
		try {
			return this.client.get(key);
		} catch {
			this.logger.error({
				type: "redis-get-error",
				key,
			});
		}
		return Promise.resolve(null);
	}

	async set(
		key: string,
		value: CacheTypes,
		expiresIn: number = 3600,
	): Promise<void> {
		let val: number | string;

		switch (typeof value) {
			case "number":
			case "string":
				val = value;
				break;
			case "object":
				val = JSON.stringify(value);
				break;
			default:
				throw new Error("Invalid value type");
		}

		try {
			await this.client.set(key, val, "EX", expiresIn);
		} catch {
			this.logger.error({
				type: "redis-set-error",
				key,
				value,
			});
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.client.del(key);
		} catch {
			this.logger.error({
				type: "redis-delete-error",
				key,
			});
		}
	}

	async keys(pattern: string): Promise<string[]> {
		try {
			return this.client.keys(pattern);
		} catch {
			this.logger.error({
				type: "redis-keys-error",
				pattern,
			});
			return [];
		}
	}

	async publish(channel: string, value: CacheTypes): Promise<void> {
		let val: string;

		switch (typeof value) {
			case "number":
			case "string":
				val = String(value);
				break;
			case "object":
				val = JSON.stringify(value);
				break;
			default:
				throw new Error("Invalid value type");
		}

		try {
			await this.client.publish(channel, val);
		} catch {
			this.logger.error({
				type: "redis-publish-error",
				channel,
				value,
			});
		}
	}

	async subscribe(
		channel: string,
		callback: (message: string) => void,
	): Promise<void> {
		if (!this.subClient) {
			this.subClient = this.client.duplicate();

			this.subClient.on("error", (err) => {
				this.logger.error({
					type: "redis-sub-client-error",
					err,
				});
			});

			this.subClient.on("message", (chan, msg) => {
				const channelCallbacks = this.callbacks.get(chan);
				if (channelCallbacks) {
					for (const cb of channelCallbacks) {
						cb(msg);
					}
				}
			});
		}

		try {
			let channelCallbacks = this.callbacks.get(channel);
			if (!channelCallbacks) {
				await this.subClient.subscribe(channel);
				channelCallbacks = new Set();
				this.callbacks.set(channel, channelCallbacks);
			}
			channelCallbacks.add(callback);
		} catch {
			this.logger.error({
				type: "redis-subscribe-error",
				channel,
			});
		}
	}

	async unsubscribe(channel: string): Promise<void> {
		if (!this.subClient) return;

		try {
			await this.subClient.unsubscribe(channel);
			this.callbacks.delete(channel);
		} catch {
			this.logger.error({
				type: "redis-unsubscribe-error",
				channel,
			});
		}
	}
}
