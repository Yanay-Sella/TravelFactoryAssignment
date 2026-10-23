import jwt, { SignOptions } from "jsonwebtoken";
import { getEnvValue } from "commoneventframework/dist/utils/getEnvValue";
import { UserRole } from "../entities/User";

export type TokenPayload = {
	sub: string;
	email: string;
	role: UserRole;
};

const secret = (): string => getEnvValue("JWT_SECRET", "change-me-in-production")!;

export const signToken = (payload: TokenPayload): string => {
	const expiresIn = getEnvValue("JWT_EXPIRES_IN", "8h") as SignOptions["expiresIn"];
	return jwt.sign(payload, secret(), { expiresIn });
};

// An expired or tampered token is an expected condition, not an error to propagate.
export const verifyToken = (token: string): TokenPayload | null => {
	try {
		return jwt.verify(token, secret()) as TokenPayload;
	} catch {
		return null;
	}
};
