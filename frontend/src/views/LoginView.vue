<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { errorMessage } from "../api/client";
import MountainMark from "../components/MountainMark.vue";
import { homeFor } from "../router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

const highlights = [
	{
		title: "Book your slopes time",
		text: "Pick the dates, add a reason, send it off.",
		icon: "M12 3 4 19h16zM9.5 14.5h5",
	},
	{
		title: "Fast approvals",
		text: "Validators review and decide in one place.",
		icon: "M5 13l4 4L19 7",
	},
	{
		title: "Always in the loop",
		text: "Every request keeps its status and comments.",
		icon: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
	},
];

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
	<main class="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
		<div class="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
			<div class="animate-rise text-center lg:text-left">
				<div class="inline-flex items-center gap-3">
					<MountainMark :size="48" />
					<span class="font-display text-xl text-frost-900">Vacation Requests</span>
				</div>

				<h1 class="mt-8 text-4xl leading-[1.05] sm:text-6xl">
					Your next ski
					<span class="block text-powder-600">escape starts here</span>
				</h1>

				<p class="mx-auto mt-5 max-w-md text-base text-frost-600 lg:mx-0 lg:text-lg">
					Plan the powder days, send the request, and let your validator do the rest.
				</p>

				<ul class="mx-auto mt-9 grid max-w-md gap-3 text-left lg:mx-0">
					<li
						v-for="highlight in highlights"
						:key="highlight.title"
						class="card card-hover flex items-center gap-4 p-4"
					>
						<span class="icon-tile">
							<svg
								viewBox="0 0 24 24"
								class="size-6"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path :d="highlight.icon" />
							</svg>
						</span>
						<span>
							<span class="block font-display text-base text-frost-900">
								{{ highlight.title }}
							</span>
							<span class="block text-sm text-frost-500">{{ highlight.text }}</span>
						</span>
					</li>
				</ul>
			</div>

			<div class="card animate-rise w-full p-7 sm:p-9" style="animation-delay: 0.1s">
				<p class="eyebrow">Welcome back</p>
				<h2 class="mt-2 text-2xl">Sign in</h2>
				<p class="mt-1 text-sm text-frost-500">Submit or review vacation requests.</p>

				<form class="mt-7 space-y-5" @submit.prevent="submit">
					<div class="space-y-1.5">
						<label for="email" class="field-label">Email</label>
						<input
							id="email"
							v-model="email"
							type="email"
							required
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
							autocomplete="current-password"
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
						{{ submitting ? "Signing in…" : "Sign in" }}
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
					No account yet?
					<RouterLink to="/signup" class="font-semibold text-powder-600 hover:text-powder-700">
						Create one
					</RouterLink>
				</p>
			</div>
		</div>
	</main>
</template>
