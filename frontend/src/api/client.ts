import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

// The token and the logout callback are pushed in from the auth store, so this module
// imports nothing from the app: no circular dependency between client and store.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null): void => {
	authToken = token;
};

export const setUnauthorizedHandler = (handler: () => void): void => {
	onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
	if (authToken) {
		config.headers.Authorization = `Bearer ${authToken}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			onUnauthorized?.();
		}
		return Promise.reject(error);
	}
);

// The API reports rule violations as { error }, which is what the UI should show.
export const errorMessage = (error: unknown, fallback = "Something went wrong"): string => {
	if (axios.isAxiosError(error)) {
		return error.response?.data?.error ?? error.message ?? fallback;
	}
	return fallback;
};
