export class HttpError extends Error {
	constructor(
		public readonly props: {
			status: number;
			message: string;
			code?: string;
			errors?: Record<PropertyKey, unknown>;
		},
	) {
		super(props.message);
	}
}
