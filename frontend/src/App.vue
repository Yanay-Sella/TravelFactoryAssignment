<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();

const signOut = async () => {
	auth.logout();
	await router.replace("/login");
};
</script>

<template>
	<div class="min-h-screen bg-slate-100">
		<header v-if="auth.isAuthenticated" class="border-b border-slate-200 bg-white">
			<div class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
				<span class="font-semibold text-slate-900">Vacation Requests</span>

				<nav class="flex gap-4 text-sm">
					<RouterLink
						v-if="auth.user?.role === 'Requester'"
						to="/my-requests"
						class="text-slate-600 hover:text-slate-900"
						active-class="font-medium text-slate-900"
					>
						My requests
					</RouterLink>
					<RouterLink
						v-if="auth.user?.role === 'Validator'"
						to="/dashboard"
						class="text-slate-600 hover:text-slate-900"
						active-class="font-medium text-slate-900"
					>
						Dashboard
					</RouterLink>
				</nav>

				<div class="ml-auto flex items-center gap-3 text-sm">
					<span class="text-slate-600">
						{{ auth.user?.name }}
						<span class="text-slate-400">· {{ auth.user?.role }}</span>
					</span>
					<button
						type="button"
						class="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
						@click="signOut"
					>
						Sign out
					</button>
				</div>
			</div>
		</header>

		<RouterView />
	</div>
</template>
