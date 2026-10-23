<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { errorMessage } from "../api/client";
import MountainMark from "../components/MountainMark.vue";
import { homeFor } from "../router";
import { useAuthStore } from "../stores/auth";

const MIN_PASSWORD_LENGTH = 8;

const auth = useAuthStore();
const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const submitting = ref(false);

const submit = async () => {
	error.value = "";

	// Checked here only for immediate feedback; the API validates every field again.
	if (password.value.length < MIN_PASSWORD_LENGTH) {
		error.value = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
		return;
	}

	if (password.value !== confirmPassword.value) {
		error.value = "The two passwords do not match";
		return;
	}

	submitting.value = true;

	try {
		await auth.signup(name.value, email.value, password.value);
		await router.replace(homeFor(auth.user!.role));
	} catch (caught) {
		error.value = errorMessage(caught, "Unable to create your account");
	} finally {
		submitting.value = false;
	}
};
</script>

<template>
	<main class="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
		<div class="w-full">
			<div class="animate-rise text-center">
				<div class="inline-flex items-center gap-3">
					<MountainMark :size="48" />
					<span class="font-display text-xl text-frost-900">Vacation Requests</span>
				</div>
			</div>

			<div class="card animate-rise mt-8 w-full p-7 sm:p-9" style="animation-delay: 0.1s">
				<p class="eyebrow">Get started</p>
				<h1 class="mt-2 text-2xl">Create your account</h1>
				<p class="mt-1 text-sm text-frost-500">
					New accounts can submit vacation requests. Validator access is granted by an
					administrator.
				</p>

				<form class="mt-7 space-y-5" @submit.prevent="submit">
					<div class="space-y-1.5">
						<label for="name" class="field-label">Full name</label>
						<input
							id="name"
							v-model="name"
							type="text"
							required
							maxlength="120"
							autocomplete="name"
							placeholder="Alice Martin"
							class="field-input"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="email" class="field-label">Email</label>
						<input
							id="email"
							v-model="email"
							type="email"
							required
							maxlength="180"
							autocomplete="username"
							placeholder="you@company.com"
							class="field-input"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="password" class="field-label">Password</label>
						<input
							id="password"
							v-model="password"
							type="password"
							required
							:minlength="MIN_PASSWORD_LENGTH"
							autocomplete="new-password"
							placeholder="••••••••"
							class="field-input"
						/>
						<p class="text-xs text-frost-500">At least {{ MIN_PASSWORD_LENGTH }} characters.</p>
					</div>

					<div class="space-y-1.5">
						<label for="confirm-password" class="field-label">Confirm password</label>
						<input
							id="confirm-password"
							v-model="confirmPassword"
							type="password"
							required
							autocomplete="new-password"
							placeholder="••••••••"
							class="field-input"
						/>
					</div>

					<p
						v-if="error"
						role="alert"
						class="rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
					>
						{{ error }}
					</p>

					<button type="submit" :disabled="submitting" class="btn btn-primary w-full py-3 text-base">
						{{ submitting ? "Creating account…" : "Create account" }}
						<svg
							v-if="!submitting"
							viewBox="0 0 24 24"
							class="size-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					</button>
				</form>

				<p class="mt-6 text-center text-sm text-frost-500">
					Already have an account?
					<RouterLink to="/login" class="font-semibold text-powder-600 hover:text-powder-700">
						Sign in
					</RouterLink>
				</p>
			</div>
		</div>
	</main>
</template>
