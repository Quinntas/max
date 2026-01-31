import { Command } from "../../../../contracts/command";
import type { ContactRepo } from "../../repo/contact.repo";
import type { GetContactsDto, GetContactsResponseDto } from "./getContacts.dto";

export class GetContactsCommand extends Command<
	GetContactsDto,
	GetContactsResponseDto
> {
	constructor(
		private readonly getContacts: typeof ContactRepo.getContacts,
		private readonly countContacts: typeof ContactRepo.countContacts,
	) {
		super("GetContactsCommand");
	}

	async handle(dto: GetContactsDto): Promise<GetContactsResponseDto> {
		const [data, total] = await Promise.all([
			this.getContacts({
				userId: dto.userId,
				search: dto.search,
				provider: dto.provider,
				limit: dto.limit,
				offset: dto.offset,
				sort: dto.sort,
			}),
			this.countContacts({
				userId: dto.userId,
				search: dto.search,
				provider: dto.provider,
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
