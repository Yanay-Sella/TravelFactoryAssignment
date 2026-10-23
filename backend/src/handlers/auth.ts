import bcrypt from "bcryptjs";
import { Response } from "commoneventframework";
import { CommonEvent } from "commoneventframework/dist/types/commonEvent";
import { requireRole } from "../auth/requireRole";
import { signToken, TokenPayload } from "../auth/jwt";
import { getDataSource } from "../db/dataSource";
import { User, UserRole } from "../entities/User";
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

// --- POST /auth/register ---

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const UNIQUE_VIOLATION = "23505";

interface RegisterInput {
	name: string;
	email: string;
	password: string;
}

export const parseRegisterInput: InputParserFn = (event: CommonEvent) => {
	let body: Partial<RegisterInput>;
	try {
		body = JSON.parse(event.body ?? "{}");
	} catch {
		return new Response(400, { error: "Request body must be valid JSON" });
	}

	const name = typeof body.name === "string" ? body.name.trim() : "";
	const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

	if (!name || name.length > 120) {
		return new Response(400, { error: "name is required and must be at most 120 characters" });
	}

	if (!EMAIL_PATTERN.test(email) || email.length > 180) {
		return new Response(400, { error: "A valid email of at most 180 characters is required" });
	}

	if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) {
		return new Response(400, {
			error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
		});
	}

	// role is deliberately not read from the body: a self-service account is always a
	// Requester, so signing up can never grant validation rights.
	return { name, email, password: body.password } as RegisterInput;
};

export const register: HandlerFn = async (input: RegisterInput) => {
	const users = (await getDataSource()).getRepository(User);

	if (await users.findOneBy({ email: input.email })) {
		return new Response(409, { error: "An account with this email already exists" });
	}

	let user: User;
	try {
		user = await users.save(
			users.create({
				name: input.name,
				email: input.email,
				password: await bcrypt.hash(input.password, 10),
				role: UserRole.Requester,
			})
		);
	} catch (caught) {
		// Two concurrent signups can both pass the check above; the unique index on
		// email is what actually decides, so its violation is reported as the conflict.
		const code = (caught as { driverError?: { code?: string } }).driverError?.code;
		if (code !== UNIQUE_VIOLATION) throw caught;

		return new Response(409, { error: "An account with this email already exists" });
	}

	// Signing up signs you in: the response matches /auth/login so the frontend
	// stores the session the same way for both.
	return new Response(201, {
		token: signToken({ sub: user.id, email: user.email, role: user.role }),
		user: publicUser(user),
	});
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
