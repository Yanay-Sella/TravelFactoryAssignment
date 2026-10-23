import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { APPROVE_VACATION_REQUEST } from "../commands/ApproveVacationRequestCommand";
import { REJECT_VACATION_REQUEST } from "../commands/RejectVacationRequestCommand";
import { dispatch } from "../commands/bus";
import { DecisionFailure, VacationDecisionResult } from "../commands/decisionResult";
import { UserRole } from "../entities/User";
import { HandlerFn, InputParserFn } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FAILURE_STATUS: Record<DecisionFailure, number> = {
	"not-found": 404,
	"already-decided": 409,
	"comment-required": 400,
};

// Rejects a malformed id here: Postgres throws on an invalid uuid comparison, which
// would otherwise surface as a 500.
const requestIdFromPath = (event: CommonEvent): string | Response => {
	const requestId = event.pathParameters?.id;

	if (!requestId || !UUID_PATTERN.test(requestId)) {
		return new Response(400, { error: "The path must contain a valid vacation request id" });
	}

	return requestId;
};

// --- PATCH /vacation-requests/:id/approve ---

interface ApproveInput {
	requestId: string;
	validatorId: string;
}

export const parseApproveVacationRequestInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Validator);
	if (auth instanceof Response) return auth;

	const requestId = requestIdFromPath(event);
	if (requestId instanceof Response) return requestId;

	return { requestId, validatorId: auth.sub } as ApproveInput;
};

export const approveVacationRequest: HandlerFn = async (input: ApproveInput) => {
	const result = await dispatch<VacationDecisionResult>({
		type: APPROVE_VACATION_REQUEST,
		...input,
	});

	if (!result.ok) {
		return new Response(FAILURE_STATUS[result.failure], { error: result.error });
	}

	return new Response(200, { request: result.request });
};

// --- PATCH /vacation-requests/:id/reject ---

interface RejectInput {
	requestId: string;
	validatorId: string;
	comments: string;
}

export const parseRejectVacationRequestInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Validator);
	if (auth instanceof Response) return auth;

	const requestId = requestIdFromPath(event);
	if (requestId instanceof Response) return requestId;

	let body: { comments?: unknown };
	try {
		body = JSON.parse(event.body ?? "{}");
	} catch {
		return new Response(400, { error: "Request body must be valid JSON" });
	}

	if (body.comments !== undefined && typeof body.comments !== "string") {
		return new Response(400, { error: "comments must be a string" });
	}

	return {
		requestId,
		validatorId: auth.sub,
		comments: (body.comments as string | undefined) ?? "",
	} as RejectInput;
};

export const rejectVacationRequest: HandlerFn = async (input: RejectInput) => {
	const result = await dispatch<VacationDecisionResult>({
		type: REJECT_VACATION_REQUEST,
		...input,
	});

	if (!result.ok) {
		return new Response(FAILURE_STATUS[result.failure], { error: result.error });
	}

	return new Response(200, { request: result.request });
};
