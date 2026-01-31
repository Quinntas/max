import { Command } from "../../../../contracts/command";
import type { MessageRepo } from "../../repo/message.repo";
import type { GetMessagesDto, GetMessagesResponseDto } from "./getMessages.dto";

export class GetMessagesCommand extends Command<
	GetMessagesDto,
	GetMessagesResponseDto
> {
	constructor(
		private readonly getMessages: typeof MessageRepo.getMessages,
		private readonly countMessages: typeof MessageRepo.countMessages,
	) {
		super("GetMessagesCommand");
	}

	async handle(dto: GetMessagesDto): Promise<GetMessagesResponseDto> {
		const [data, total] = await Promise.all([
			this.getMessages({
				conversationPid: dto.conversationPid,
				userId: dto.userId,
				limit: dto.limit,
				offset: dto.offset,
				sort: dto.sort,
			}),
			this.countMessages({
				conversationPid: dto.conversationPid,
				userId: dto.userId,
			}),
		]);

		const nextOffset = dto.offset + dto.limit;
		const isMore = nextOffset < total;

		return {
			data,
			pagination: {
				total,
				isMore,
				nextOffset: isMore ? nextOffset : null,
			},
		};
	}
}
