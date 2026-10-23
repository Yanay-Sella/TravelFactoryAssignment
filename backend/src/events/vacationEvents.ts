import { subscribe } from "./bus";

export const VACATION_REQUEST_CREATED = "VacationRequestCreatedEvent";

export type VacationRequestCreatedEvent = {
	type: typeof VACATION_REQUEST_CREATED;
	requestId: string;
	userId: string;
	startDate: string;
	endDate: string;
};

// The only subscriber: it logs. This is the seam where notifications (email, Slack,
// calendar sync) would attach — none of which exist in this project, so nothing is
// faked here. Registered on import, which is why commands import from this module.
subscribe(VACATION_REQUEST_CREATED, (event: VacationRequestCreatedEvent) => {
	console.log(
		`[event] ${event.type} request=${event.requestId} user=${event.userId} ${event.startDate}..${event.endDate}`
	);
});

export const VACATION_REQUEST_APPROVED = "VacationRequestApprovedEvent";
export const VACATION_REQUEST_REJECTED = "VacationRequestRejectedEvent";

export type VacationRequestApprovedEvent = {
	type: typeof VACATION_REQUEST_APPROVED;
	requestId: string;
	userId: string;
	validatorId: string;
};

export type VacationRequestRejectedEvent = {
	type: typeof VACATION_REQUEST_REJECTED;
	requestId: string;
	userId: string;
	validatorId: string;
	comments: string;
};

subscribe(VACATION_REQUEST_APPROVED, (event: VacationRequestApprovedEvent) => {
	console.log(
		`[event] ${event.type} request=${event.requestId} user=${event.userId} validator=${event.validatorId}`
	);
});

subscribe(VACATION_REQUEST_REJECTED, (event: VacationRequestRejectedEvent) => {
	console.log(
		`[event] ${event.type} request=${event.requestId} user=${event.userId} validator=${event.validatorId} reason="${event.comments}"`
	);
});
