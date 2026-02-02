export interface HandleIncomingSmsDto {
	from: string;
	to: string;
	body: string;
	messageSid: string;
}
