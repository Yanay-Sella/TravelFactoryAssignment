<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import AppBackdrop from "./components/AppBackdrop.vue";
import MountainMark from "./components/MountainMark.vue";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();

const initials = computed(() =>
	(auth.user?.name ?? "")
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]!.toUpperCase())
		.join("")
);

const signOut = async () => {
	auth.logout();
	await router.replace("/login");
};
</script>

<template>
	<div class="min-h-screen">
		<AppBackdrop />

		<header v-if="auth.isAuthenticated" class="sticky top-0 z-30 px-4 pt-4">
			<div class="card mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
				<RouterLink to="/" class="flex items-center gap-3">
					<MountainMark :size="40" />
					<span class="font-display text-lg leading-tight text-frost-900">
						Vacation&nbsp;Requests
					</span>
				</RouterLink>

				<nav class="flex gap-1">
					<RouterLink
						v-if="auth.user?.role === 'Requester'"
						to="/my-requests"
						class="nav-link"
						active-class="nav-link-active"
					>
						My requests
					</RouterLink>
					<RouterLink
						v-if="auth.user?.role === 'Validator'"
						to="/dashboard"
						class="nav-link"
						active-class="nav-link-active"
					>
						Dashboard
					</RouterLink>
				</nav>

				<div class="ml-auto flex items-center gap-3">
					<div class="flex items-center gap-2.5">
						<span
							class="grid size-10 place-items-center rounded-full bg-linear-to-br from-powder-400 to-powder-600 text-sm font-bold text-white shadow-soft"
						>
							{{ initials }}
						</span>
						<span class="hidden text-sm leading-tight sm:block">
							<span class="block font-bold text-frost-900">{{ auth.user?.name }}</span>
							<span class="block text-xs text-powder-600">{{ auth.user?.role }}</span>
						</span>
					</div>

					<button type="button" class="btn btn-ghost" @click="signOut">Sign out</button>
				</div>
			</div>
		</header>

		<RouterView />
	</div>
</template>
