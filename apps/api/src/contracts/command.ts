import { SpanStatusCode, type Tracer, trace } from "@opentelemetry/api";
import { logger } from "../start/logger";
import { safeJsonStringifyWithAnyPrimitive } from "../utils/safeJsonStringify";

export abstract class Command<DTO, ResponseDTO, Args extends unknown[] = []> {
	private readonly _tracer: Tracer;

	protected constructor(private readonly _traceName: string) {
		this._tracer = trace.getTracer(this._traceName);
	}

	get tracerName() {
		return this._traceName;
	}

	get tracer() {
		return this._tracer;
	}

	async instrumentedHandle(dto: DTO, ...args: Args): Promise<ResponseDTO> {
		return this._tracer.startActiveSpan(
			`${this._traceName}.handle`,
			{
				attributes: {
					dto: safeJsonStringifyWithAnyPrimitive(dto) ?? "null",
					args: safeJsonStringifyWithAnyPrimitive(args) ?? "null",
				},
			},
			async (span) => {
				const startTime = performance.now();
				let result: ResponseDTO | undefined;
				let handleErr: unknown | undefined;

				try {
					await this.runBeforeHandle(dto, args);

					result = await this.handle(dto, ...args);

					await this.runAfterSuccessfulHandle(dto, result, args);

					span.setAttribute(
						"result",
						safeJsonStringifyWithAnyPrimitive(result) ?? "null",
					);
					return result;
				} catch (error: unknown) {
					handleErr = error;
					if (error instanceof Error) {
						span.recordException(error);
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: error.message,
						});

						logger.error({
							type: `${this._traceName}.handle`,
							message: error.message,
							stack: error.stack,
							name: error.name,
							cause: error.cause,
							context: {
								dto,
								args,
							},
						});
					}

					await this.runAfterFailedHandle(dto, error, args);

					throw error;
				} finally {
					await this.runAfterHandle(dto, result, handleErr, args);

					const endTime = performance.now();
					span.setAttribute("duration", endTime - startTime);
					span.end();
				}
			},
		);
	}

	private async runBeforeHandle(dto: DTO, args: Args): Promise<void> {
		if (!this.beforeHandle) {
			return;
		}

		return this._tracer.startActiveSpan(
			`${this._traceName}.beforeHandle`,
			async (span) => {
				try {
					if (this.beforeHandle) {
						await this.beforeHandle(dto, ...args);
					}
				} catch (error: unknown) {
					if (error instanceof Error) {
						logger.error({
							type: `${this._traceName}.beforeHandle`,
							message: error.message,
							stack: error.stack,
							name: error.name,
							cause: error.cause,
							context: {
								dto,
								args,
							},
						});
					}
				} finally {
					span.end();
				}
			},
		);
	}

	private async runAfterSuccessfulHandle(
		dto: DTO,
		result: ResponseDTO,
		args: Args,
	): Promise<void> {
		if (!this.afterSuccessfulHandle) {
			return;
		}

		return this._tracer.startActiveSpan(
			`${this._traceName}.afterSuccessfulHandle`,
			async (span) => {
				try {
					if (this.afterSuccessfulHandle) {
						await this.afterSuccessfulHandle(dto, result, ...args);
					}
				} catch (error: unknown) {
					if (error instanceof Error) {
						logger.error({
							type: `${this._traceName}.afterSuccessfulHandle`,
							message: error.message,
							stack: error.stack,
							name: error.name,
							cause: error.cause,
							context: {
								dto,
								args,
							},
						});
					}
				} finally {
					span.end();
				}
			},
		);
	}

	private async runAfterFailedHandle(
		dto: DTO,
		error: unknown,
		args: Args,
	): Promise<void> {
		if (!this.afterFailedHandle) {
			return;
		}

		return this._tracer.startActiveSpan(
			`${this._traceName}.afterFailedHandle`,
			async (span) => {
				try {
					if (this.afterFailedHandle) {
						await this.afterFailedHandle(dto, error, ...args);
					}
				} catch (err: unknown) {
					if (err instanceof Error) {
						logger.error({
							type: `${this._traceName}.afterFailedHandle`,
							message: err.message,
							stack: err.stack,
							name: err.name,
							cause: err.cause,
							context: {
								dto,
								args,
							},
						});
					}
				} finally {
					span.end();
				}
			},
		);
	}

	private async runAfterHandle(
		dto: DTO,
		result: ResponseDTO | undefined,
		error: unknown | undefined,
		args: Args,
	): Promise<void> {
		if (!this.afterHandle) {
			return;
		}

		return this._tracer.startActiveSpan(
			`${this._traceName}.afterHandle`,
			async (span) => {
				try {
					if (this.afterHandle) {
						await this.afterHandle(dto, result, error, ...args);
					}
				} catch (err: unknown) {
					if (err instanceof Error) {
						logger.error({
							type: `${this._traceName}.afterHandle`,
							message: err.message,
							stack: err.stack,
							name: err.name,
							cause: err.cause,
							context: {
								dto,
								args,
							},
						});
					}
				} finally {
					span.end();
				}
			},
		);
	}

	beforeHandle?(dto: DTO, ...args: Args): Promise<void>;
	afterSuccessfulHandle?(
		dto: DTO,
		responseDto: ResponseDTO,
		...args: Args
	): Promise<void>;
	afterFailedHandle?(dto: DTO, error: unknown, ...args: Args): Promise<void>;
	afterHandle?(
		dto: DTO,
		responseDto: ResponseDTO | undefined,
		error: unknown | undefined,
		...args: Args
	): Promise<void>;

	abstract handle(dto: DTO, ...args: Args): Promise<ResponseDTO> | ResponseDTO;
}
