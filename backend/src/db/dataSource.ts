import "reflect-metadata";
import { DataSource } from "typeorm";
import { getEnvValue } from "commoneventframework/dist/utils/getEnvValue";
import { User } from "../entities/User";
import { VacationRequest } from "../entities/VacationRequest";

let initializing: Promise<DataSource> | undefined;

// Built on first call, never at import time: CEF's loadEnv() is async, so process.env
// is only populated once it resolves. Caching the promise also means a warm Lambda
// container reuses one connection instead of reconnecting per invocation.
export const getDataSource = (): Promise<DataSource> => {
	initializing ??= new DataSource({
		type: "postgres",
		host: getEnvValue("DB_HOST", "localhost"),
		port: Number(getEnvValue("DB_PORT", "5432")),
		username: getEnvValue("DB_USER", "vacation"),
		password: getEnvValue("DB_PASSWORD", "vacation"),
		database: getEnvValue("DB_NAME", "vacation"),
		entities: [User, VacationRequest],
		synchronize: true,
		logging: false,
	}).initialize();

	return initializing;
};
