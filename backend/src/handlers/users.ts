import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { getDataSource } from "../db/dataSource";
import { User, UserRole } from "../entities/User";
import { HandlerFn, InputParserFn } from "./types";

// --- GET /users ---
// Exists so the validator dashboard can offer a "filter by user" control.

export const parseListUsersInput: InputParserFn = (event: CommonEvent) => {
	const auth = requireRole(event, UserRole.Validator);
	return auth instanceof Response ? auth : {};
};

export const listUsers: HandlerFn = async () => {
	const users = (await getDataSource()).getRepository(User);

	return {
		users: await users.find({
			select: { id: true, name: true, email: true, role: true },
			order: { name: "ASC" },
		}),
	};
};
