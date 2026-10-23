import { FindOptionsWhere } from "typeorm";
import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { dispatch } from "../commands/bus";
import {
	CREATE_VACATION_REQUEST,
	CreateVacationRequestResult,
} from "../commands/CreateVacationRequestCommand";
import { getDataSource } from "../db/dataSource";
import { UserRole } from "../entities/User";
import { VacationRequest, VacationStatus } from "../entities/VacationRequest";
import { HandlerFn, InputParserFn } from "./types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Columns the validator view exposes per row: everything except the user's password.
const LIST_SELECTION = {
	id: true,
	userId: true,
	startDate: true,
	endDate: true,
	reason: true,
	status: true,
	comments: true,
	createdAt: true,
	updatedAt: true,
	user: { id: true, name: true, email: true, role: true },
} as const;

// The team view is visible to colleagues, so it carries who and when but not why:
// reason and comments stay out of it.
const TEAM_SELECTION = {
	id: true,
	userId: true,
	startDate: true,
	endDate: true,
	status: true,
	user: { id: true, name: true },
} as const;

// Round-trips the date, because Date silently rolls invalid days over:
// "2027-02-30" parses to 2027-03-02 rather than failing.
const isCalendarDate = (value: unknown): value is string => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const parsed = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const parsePositiveInt = (raw: string | undefined, fallback: number): number | null => {
	if (raw === undefined || raw === "") return fallback;
	if (!/^\d+$/.test(raw)) return null;

	const value = Number(raw);
	return value >= 1 ? value : null;
};

// Shared by both list endpoints; limit is clamped so a caller cannot ask for everything.
const parsePagination = (
	query: CommonEvent["queryStringParameters"]
): { page: number; limit: number } | Response => {
	const page = parsePositiveInt(query?.page, 1);
	const limit = parsePositiveInt(query?.limit, DEFAULT_LIMIT);

	if (page === null || limit === null) {
		return new Response(400, { error: "page and limit must be positive integers" });
	}

	return { page, limit: Math.min(limit, MAX_LIMIT) };
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

// --- GET /vacation-requests (the caller's own requests) ---

interface ListMyRequestsInput {
	userId: string;
	page: number;
	limit: number;
}

export const parseListMyRequestsInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Requester);
	if (auth instanceof Response) return auth;

	const pagination = parsePagination(event.queryStringParameters);
	if (pagination instanceof Response) return pagination;

	// userId comes from the token, never the query: a caller cannot read another user.
	return { userId: auth.sub, ...pagination } as ListMyRequestsInput;
};

export const listMyRequests: HandlerFn = async (input: ListMyRequestsInput) => {
	const requests = (await getDataSource()).getRepository(VacationRequest);

	const [data, total] = await requests.findAndCount({
		where: { userId: input.userId },
		// id breaks ties: without a total order, paging can repeat or skip rows.
		order: { createdAt: "DESC", id: "DESC" },
		skip: (input.page - 1) * input.limit,
		take: input.limit,
	});

	return {
		data,
		total,
		page: input.page,
		limit: input.limit,
		totalPages: Math.ceil(total / input.limit),
	};
};

// --- GET /vacation-requests/all (validator dashboard) ---

interface ListAllRequestsInput {
	status: VacationStatus | null;
	userId: string | null;
	page: number;
	limit: number;
}

export const parseListAllRequestsInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Validator);
	if (auth instanceof Response) return auth;

	const pagination = parsePagination(event.queryStringParameters);
	if (pagination instanceof Response) return pagination;

	const status = event.queryStringParameters?.status || null;
	if (status && !Object.values(VacationStatus).includes(status as VacationStatus)) {
		return new Response(400, {
			error: `status must be one of: ${Object.values(VacationStatus).join(", ")}`,
		});
	}

	// Postgres throws on a malformed uuid comparison, so reject it here as a 400.
	const userId = event.queryStringParameters?.userId || null;
	if (userId && !UUID_PATTERN.test(userId)) {
		return new Response(400, { error: "userId must be a valid uuid" });
	}

	return { status: status as VacationStatus | null, userId, ...pagination } as ListAllRequestsInput;
};

export const listAllRequests: HandlerFn = async (input: ListAllRequestsInput) => {
	const requests = (await getDataSource()).getRepository(VacationRequest);

	const where: FindOptionsWhere<VacationRequest> = {};
	if (input.status) where.status = input.status;
	if (input.userId) where.userId = input.userId;

	const [data, total] = await requests.findAndCount({
		where,
		relations: { user: true },
		select: LIST_SELECTION,
		order: { createdAt: "DESC", id: "DESC" },
		skip: (input.page - 1) * input.limit,
		take: input.limit,
	});

	return {
		data,
		total,
		page: input.page,
		limit: input.limit,
		totalPages: Math.ceil(total / input.limit),
	};
};

// --- GET /vacation-requests/team (approved vacations, both roles) ---

interface TeamPlanningInput {
	page: number;
	limit: number;
}

export const parseTeamPlanningInput: InputParserFn = (event: CommonEvent) => {
	// No role argument: both Requesters and Validators plan around the same calendar.
	const auth = requireRole(event);
	if (auth instanceof Response) return auth;

	const pagination = parsePagination(event.queryStringParameters);
	if (pagination instanceof Response) return pagination;

	return pagination as TeamPlanningInput;
};

export const listTeamPlanning: HandlerFn = async (input: TeamPlanningInput) => {
	const requests = (await getDataSource()).getRepository(VacationRequest);

	const [data, total] = await requests.findAndCount({
		where: { status: VacationStatus.Approved },
		relations: { user: true },
		select: TEAM_SELECTION,
		order: { startDate: "ASC", id: "ASC" },
		skip: (input.page - 1) * input.limit,
		take: input.limit,
	});

	return {
		data,
		total,
		page: input.page,
		limit: input.limit,
		totalPages: Math.ceil(total / input.limit),
	};
};
