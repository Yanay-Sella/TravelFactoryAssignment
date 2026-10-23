<script setup lang="ts">
import MountainMark from "../components/MountainMark.vue";
import PageHero from "../components/PageHero.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const duties = [
	{
		title: "Review requests",
		text: "Every pending trip from your team, in one queue.",
		icon: "M4 6h16M4 12h16M4 18h10",
	},
	{
		title: "Approve or reject",
		text: "Decide with a comment so the reason travels with the request.",
		icon: "M5 13l4 4L19 7",
	},
	{
		title: "Filter by status",
		text: "Narrow the list down to what still needs you.",
		icon: "M4 5h16l-6 7v6l-4 2v-8z",
	},
];
</script>

<template>
	<section class="mx-auto max-w-6xl animate-rise space-y-6 px-4 py-8">
		<PageHero
			eyebrow="Validator"
			:title="`Base camp, ${auth.user?.name ?? 'validator'}`"
			:subtitle="`Signed in as ${auth.user?.email} · ${auth.user?.role}. Review the team's requests and keep the season moving.`"
		>
			<template #aside>
				<div class="animate-float rounded-card bg-white/15 p-6 backdrop-blur-sm">
					<MountainMark :size="104" />
				</div>
			</template>
		</PageHero>

		<div class="grid gap-4 sm:grid-cols-3">
			<div v-for="duty in duties" :key="duty.title" class="card card-hover p-6">
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
						<path :d="duty.icon" />
					</svg>
				</span>
				<h2 class="mt-4 text-lg">{{ duty.title }}</h2>
				<p class="mt-1 text-sm text-frost-500">{{ duty.text }}</p>
			</div>
		</div>

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Coming next</p>
			<h2 class="mt-2 text-2xl">Request queue</h2>
			<p class="mt-2 text-sm text-frost-500">
				The request table, filters and approve/reject actions are added in layer 8.
			</p>
		</div>
	</section>
</template>
