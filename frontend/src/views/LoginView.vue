<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { errorMessage } from "../api/client";
import { homeFor } from "../router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

const submit = async () => {
	error.value = "";
	submitting.value = true;

	try {
		await auth.login(email.value, password.value);
		await router.replace(homeFor(auth.user!.role));
	} catch (caught) {
		error.value = errorMessage(caught, "Unable to sign in");
	} finally {
		submitting.value = false;
	}
};
</script>

<template>
	<main class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
		<div class="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
			<h1 class="text-xl font-semibold text-slate-900">Vacation Requests</h1>
			<p class="mt-1 text-sm text-slate-500">Sign in to submit or review requests.</p>

			<form class="mt-6 space-y-4" @submit.prevent="submit">
				<div>
					<label for="email" class="block text-sm font-medium text-slate-700">Email</label>
					<input
						id="email"
						v-model="email"
						type="email"
						required
						autocomplete="username"
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-slate-700">Password</label>
					<input
						id="password"
						v-model="password"
						type="password"
						required
						autocomplete="current-password"
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
					/>
				</div>

				<p v-if="error" role="alert" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{{ error }}
				</p>

				<button
					type="submit"
					:disabled="submitting"
					class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
				>
					{{ submitting ? "Signing in…" : "Sign in" }}
				</button>
			</form>
		</div>
	</main>
</template>
