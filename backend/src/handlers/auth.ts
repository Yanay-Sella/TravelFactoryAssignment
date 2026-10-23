import bcrypt from "bcryptjs";
import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { signToken, TokenPayload } from "../auth/jwt";
import { getDataSource } from "../db/dataSource";
import { User } from "../entities/User";
import { HandlerFn, InputParserFn } from "./types";

// The only shape a User is ever exposed in: keeps the password hash out of every response.
const publicUser = (user: User) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
});

// --- POST /auth/login ---

interface LoginInput {
	email: string;
	password: string;
}

export const parseLoginInput: InputParserFn = (event: CommonEvent) => {
	let body: Partial<LoginInput>;
	try {
		body = JSON.parse(event.body ?? "{}");
	} catch {
		return new Response(400, { error: "Request body must be valid JSON" });
	}

	if (typeof body.email !== "string" || typeof body.password !== "string") {
		return new Response(400, { error: "email and password are required" });
	}

	return { email: body.email, password: body.password } as LoginInput;
};

export const login: HandlerFn = async (input: LoginInput) => {
	const users = (await getDataSource()).getRepository(User);
	const user = await users.findOneBy({ email: input.email.trim().toLowerCase() });

	// One message for both causes, so the endpoint cannot be used to discover accounts.
	if (!user || !(await bcrypt.compare(input.password, user.password))) {
		return new Response(401, { error: "Invalid email or password" });
	}

	return {
		token: signToken({ sub: user.id, email: user.email, role: user.role }),
		user: publicUser(user),
	};
};

// --- GET /auth/me ---

export const parseMeInput: InputParserFn = (event: CommonEvent) => requireRole(event);

export const me: HandlerFn = async (input: TokenPayload) => {
	const users = (await getDataSource()).getRepository(User);
	const user = await users.findOneBy({ id: input.sub });

	if (!user) {
		return new Response(401, { error: "User no longer exists" });
	}

	return { user: publicUser(user) };
};
