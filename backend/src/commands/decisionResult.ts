import { VacationRequest } from "../entities/VacationRequest";

export type DecisionFailure = "not-found" | "already-decided" | "comment-required";

// Approve and reject share this shape. The failure is named, not numbered: the handler
// maps it to a status code so the domain stays free of HTTP concerns.
export type VacationDecisionResult =
	| { ok: true; request: VacationRequest }
	| { ok: false; failure: DecisionFailure; error: string };
