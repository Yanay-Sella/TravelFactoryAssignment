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
