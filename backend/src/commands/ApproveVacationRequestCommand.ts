import { getDataSource } from "../db/dataSource";
import { VacationRequest, VacationStatus } from "../entities/VacationRequest";
import { emit } from "../events/bus";
import { VACATION_REQUEST_APPROVED } from "../events/vacationEvents";
import { registerCommand } from "./bus";
import { VacationDecisionResult } from "./decisionResult";

export const APPROVE_VACATION_REQUEST = "ApproveVacationRequestCommand";

export type ApproveVacationRequestCommand = {
	type: typeof APPROVE_VACATION_REQUEST;
	requestId: string;
	validatorId: string;
};

const handleApproveVacationRequest = async (
	command: ApproveVacationRequestCommand
): Promise<VacationDecisionResult> => {
	const requests = (await getDataSource()).getRepository(VacationRequest);

	// Rule 3, enforced in the WHERE clause: only a Pending row can be decided, so two
	// validators acting at the same moment cannot both succeed.
	const updated = await requests.update(
		{ id: command.requestId, status: VacationStatus.Pending },
		{ status: VacationStatus.Approved }
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
		type: VACATION_REQUEST_APPROVED,
		requestId: request.id,
		userId: request.userId,
		validatorId: command.validatorId,
	});

	return { ok: true, request };
};

registerCommand(APPROVE_VACATION_REQUEST, handleApproveVacationRequest);
