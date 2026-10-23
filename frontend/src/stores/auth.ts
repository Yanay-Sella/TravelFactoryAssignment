import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, setAuthToken } from "../api/client";
import type { User } from "../api/types";

const TOKEN_KEY = "vacation.token";

// localStorage throws in some privacy modes, so every access is guarded.
const readStoredToken = (): string | null => {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
};

const writeStoredToken = (token: string | null): void => {
	try {
		token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
	} catch {
		// A session that cannot be persisted still works until the tab closes.
	}
};

export const useAuthStore = defineStore("auth", () => {
	const user = ref<User | null>(null);
	const token = ref<string | null>(null);
	const ready = ref(false);

	const isAuthenticated = computed(() => user.value !== null);

	const apply = (nextToken: string | null, nextUser: User | null): void => {
		token.value = nextToken;
		user.value = nextUser;
		setAuthToken(nextToken);
		writeStoredToken(nextToken);
	};

	const login = async (email: string, password: string): Promise<void> => {
		const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
			email,
			password,
		});
		apply(data.token, data.user);
	};

	const logout = (): void => apply(null, null);

	// Called once at startup: a stored token is only trusted after the API confirms it.
	const restore = async (): Promise<void> => {
		const stored = readStoredToken();

		if (stored) {
			setAuthToken(stored);
			try {
				const { data } = await api.get<{ user: User }>("/auth/me");
				apply(stored, data.user);
			} catch {
				apply(null, null);
			}
		}

		ready.value = true;
	};

	return { user, token, ready, isAuthenticated, login, logout, restore };
});
