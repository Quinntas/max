import { Command } from "../../../../contracts/command";
import type { ConversationRepo } from "../../repo/conversation.repo";
import type {
	GetConversationsDto,
	GetConversationsResponseDto,
} from "./getConversations.dto";

export class GetConversationsCommand extends Command<
	GetConversationsDto,
	GetConversationsResponseDto
> {
	constructor(
		private readonly getConversations: typeof ConversationRepo.getConversations,
		private readonly countConversations: typeof ConversationRepo.countConversations,
	) {
		super("GetConversationsCommand");
	}

	async handle(dto: GetConversationsDto): Promise<GetConversationsResponseDto> {
		const [data, total] = await Promise.all([
			this.getConversations({
				userId: dto.userId,
				contactPid: dto.contactPid,
				status: dto.status,
				limit: dto.limit,
				offset: dto.offset,
				sort: dto.sort,
			}),
			this.countConversations({
				userId: dto.userId,
				contactPid: dto.contactPid,
				status: dto.status,
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
