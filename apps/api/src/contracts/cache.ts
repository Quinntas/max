export type CacheTypes = number | string | Record<PropertyKey, any>;

export abstract class Cache {
	abstract get(key: string): Promise<string | null>;

	abstract set(
		key: string,
		value: CacheTypes,
		expiresIn: number,
	): Promise<void>;

	abstract delete(key: string): Promise<void>;

	abstract keys(pattern: string): Promise<string[]>;

	abstract publish(channel: string, value: CacheTypes): Promise<void>;

	abstract subscribe(
		channel: string,
		callback: (message: string) => void,
	): Promise<void>;

	abstract unsubscribe(channel: string): Promise<void>;

	async it<T extends CacheTypes>(
		key: string,
		handler: () => Promise<T>,
		expiresIn: number = 3600,
		deserializer: (value: string) => T = JSON.parse,
		serializer: (value: T) => string = JSON.stringify,
	) {
		const value = await this.get(key);

		if (value) return deserializer(value);

		const newValue = await handler();

		await this.set(key, serializer(newValue), expiresIn);

		return newValue;
	}
}

export function CacheMethod(
	cache: Cache,
	expiresIn: number = 3600,
	keyPrefix?: string,
) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			const className = target.constructor.name;
			const argsKey = args.map((arg) => JSON.stringify(arg)).join(",");
			const key = `${`${keyPrefix}.` || ""}${className}.${propertyKey}.${argsKey}`;
			return await cache.it(
				key,
				() => originalMethod.apply(this, args),
				expiresIn,
			);
		};
	};
}
