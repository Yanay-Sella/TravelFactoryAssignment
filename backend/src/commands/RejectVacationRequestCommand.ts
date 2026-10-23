import { getDataSource } from "../db/dataSource";
import { VacationRequest, VacationStatus } from "../entities/VacationRequest";
import { emit } from "../events/bus";
import { VACATION_REQUEST_REJECTED } from "../events/vacationEvents";
import { registerCommand } from "./bus";
import { VacationDecisionResult } from "./decisionResult";

export const REJECT_VACATION_REQUEST = "RejectVacationRequestCommand";

export type RejectVacationRequestCommand = {
	type: typeof REJECT_VACATION_REQUEST;
	requestId: string;
	validatorId: string;
	comments: string;
};

const handleRejectVacationRequest = async (
	command: RejectVacationRequestCommand
): Promise<VacationDecisionResult> => {
	// Rule 5 lives here rather than in the parser, so it holds for every caller.
	const comments = command.comments.trim();
	if (!comments) {
		return {
			ok: false,
			failure: "comment-required",
			error: "A comment is required when rejecting a request",
		};
	}

	const requests = (await getDataSource()).getRepository(VacationRequest);

	// Rule 3, enforced in the WHERE clause: only a Pending row can be decided.
	const updated = await requests.update(
		{ id: command.requestId, status: VacationStatus.Pending },
		{ status: VacationStatus.Rejected, comments }
	);

	if (updated.affected === 0) {
		const existing = await requests.findOneBy({ id: command.requestId });

		return existing
			? {
					ok: false,
					failure: "already-decided",
					error: `This request has already been ${existing.status.toLowerCase()}`,
				}
			: { ok: false, failure: "not-found", error: "Vacation request not found" };
	}

	const request = await requests.findOneByOrFail({ id: command.requestId });

	await emit({
		type: VACATION_REQUEST_REJECTED,
		requestId: request.id,
		userId: request.userId,
		validatorId: command.validatorId,
		comments,
	});

	return { ok: true, request };
};

registerCommand(REJECT_VACATION_REQUEST, handleRejectVacationRequest);
