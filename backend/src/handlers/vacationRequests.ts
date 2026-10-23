import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { dispatch } from "../commands/bus";
import {
	CREATE_VACATION_REQUEST,
	CreateVacationRequestResult,
} from "../commands/CreateVacationRequestCommand";
import { UserRole } from "../entities/User";
import { HandlerFn, InputParserFn } from "./types";

// Round-trips the date, because Date silently rolls invalid days over:
// "2027-02-30" parses to 2027-03-02 rather than failing.
const isCalendarDate = (value: unknown): value is string => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const parsed = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

// --- POST /vacation-requests ---

interface CreateVacationRequestInput {
	userId: string;
	startDate: string;
	endDate: string;
	reason: string | null;
}

export const parseCreateVacationRequestInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Requester);
	if (auth instanceof Response) return auth;

	let body: Partial<Record<keyof CreateVacationRequestInput, unknown>>;
	try {
		body = JSON.parse(event.body ?? "{}");
	} catch {
		return new Response(400, { error: "Request body must be valid JSON" });
	}

	if (!isCalendarDate(body.startDate) || !isCalendarDate(body.endDate)) {
		return new Response(400, {
			error: "startDate and endDate are required, formatted as YYYY-MM-DD",
		});
	}

	if (body.reason !== undefined && body.reason !== null && typeof body.reason !== "string") {
		return new Response(400, { error: "reason must be a string when provided" });
	}

	return {
		userId: auth.sub,
		startDate: body.startDate,
		endDate: body.endDate,
		reason: (body.reason as string | undefined)?.trim() || null,
	} as CreateVacationRequestInput;
};

export const createVacationRequest: HandlerFn = async (input: CreateVacationRequestInput) => {
	const result = await dispatch<CreateVacationRequestResult>({
		type: CREATE_VACATION_REQUEST,
		...input,
	});

	if (!result.ok) {
		return new Response(400, { error: result.error });
	}

	return new Response(201, { request: result.request });
};
