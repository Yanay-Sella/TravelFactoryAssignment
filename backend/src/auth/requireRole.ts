import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { UserRole } from "../entities/User";
import { TokenPayload, verifyToken } from "./jwt";

// CEF has no middleware, so each protected route calls this from its x-inputParser and
// returns the Response untouched when it gets one — index.ts then skips the handler.
export const requireRole = (event: CommonEvent, role?: UserRole): TokenPayload | Response => {
	const header = event.headers?.authorization ?? event.headers?.Authorization;

	if (!header?.startsWith("Bearer ")) {
		return new Response(401, { error: "Missing bearer token" });
	}

	const payload = verifyToken(header.slice("Bearer ".length));
	if (!payload) {
		return new Response(401, { error: "Invalid or expired token" });
	}

	if (role && payload.role !== role) {
		return new Response(403, { error: `This action requires the ${role} role` });
	}

	return payload;
};
