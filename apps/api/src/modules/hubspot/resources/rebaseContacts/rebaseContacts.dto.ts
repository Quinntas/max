import { z } from "zod";

export const rebaseContactsDto = z.object({
	userId: z.string(),
});

export type RebaseContactsDto = z.infer<typeof rebaseContactsDto>;
