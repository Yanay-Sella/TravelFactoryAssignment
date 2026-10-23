import { In } from "typeorm";
import { getDataSource } from "../db/dataSource";
import { VacationRequest, VacationStatus } from "../entities/VacationRequest";
import { endsAfterStart, overlapsAny, startsNotInPast } from "../domain/vacationRules";
import { emit } from "../events/bus";
import { VACATION_REQUEST_CREATED } from "../events/vacationEvents";
import { registerCommand } from "./bus";

export const CREATE_VACATION_REQUEST = "CreateVacationRequestCommand";

export type CreateVacationRequestCommand = {
	type: typeof CREATE_VACATION_REQUEST;
	userId: string;
	startDate: string;
	endDate: string;
	reason: string | null;
};

// Rule violations are returned, not thrown: the caller maps them to a 400 and the
// domain stays free of any HTTP concern.
export type CreateVacationRequestResult =
	| { ok: true; request: VacationRequest }
	| { ok: false; error: string };

const handleCreateVacationRequest = async (
	command: CreateVacationRequestCommand
): Promise<CreateVacationRequestResult> => {
	if (!endsAfterStart(command)) {
		return { ok: false, error: "End date must be after start date" };
	}

	if (!startsNotInPast(command)) {
		return { ok: false, error: "A vacation request cannot start in the past" };
	}

	const requests = (await getDataSource()).getRepository(VacationRequest);

	// A rejected request must not block the same dates, so only these two count.
	const active = await requests.find({
		where: {
			userId: command.userId,
			status: In([VacationStatus.Pending, VacationStatus.Approved]),
		},
		select: { startDate: true, endDate: true },
	});

	if (overlapsAny(active, command)) {
		return {
			ok: false,
			error: "This request overlaps one of your pending or approved requests",
		};
	}

	const request = await requests.save(
		requests.create({
			userId: command.userId,
			startDate: command.startDate,
			endDate: command.endDate,
			reason: command.reason,
			status: VacationStatus.Pending,
		})
	);

	await emit({
		type: VACATION_REQUEST_CREATED,
		requestId: request.id,
		userId: request.userId,
		startDate: request.startDate,
		endDate: request.endDate,
	});

	return { ok: true, request };
};

registerCommand(CREATE_VACATION_REQUEST, handleCreateVacationRequest);
