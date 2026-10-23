<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<template>
	<section class="mx-auto max-w-5xl px-4 py-8">
		<h1 class="text-lg font-semibold text-slate-900">Dashboard</h1>
		<p class="mt-1 text-sm text-slate-500">
			Signed in as {{ auth.user?.email }} ({{ auth.user?.role }}).
		</p>
		<p class="mt-6 rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm">
			The request table, filters and approve/reject actions are added in layer 8.
		</p>
	</section>
</template>
