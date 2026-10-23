<script setup lang="ts">
import MountainMark from "../components/MountainMark.vue";
import PageHero from "../components/PageHero.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const statuses = [
	{ label: "Pending", pill: "pill-pending", text: "Waiting for a validator to review it." },
	{ label: "Approved", pill: "pill-approved", text: "Your days off are confirmed." },
	{ label: "Rejected", pill: "pill-rejected", text: "Check the comments for the reason." },
];
</script>

<template>
	<section class="mx-auto max-w-6xl animate-rise space-y-6 px-4 py-8">
		<PageHero
			eyebrow="My requests"
			:title="`Hey ${auth.user?.name ?? 'there'}!`"
			:subtitle="`Signed in as ${auth.user?.email} · ${auth.user?.role}. Plan your trip, send a request, and follow it all the way to approval.`"
		>
			<template #aside>
				<div class="animate-float rounded-card bg-white/15 p-6 backdrop-blur-sm">
					<MountainMark :size="104" />
				</div>
			</template>
		</PageHero>

		<div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
			<div class="card card-hover p-6 sm:p-8">
				<p class="eyebrow">Coming next</p>
				<h2 class="mt-2 text-2xl">Your trip board</h2>
				<p class="mt-2 text-sm text-frost-500">
					The submission form and request list are added in layer 7.
				</p>
			</div>

			<div class="card p-6 sm:p-8">
				<p class="eyebrow">Status key</p>
				<ul class="mt-4 space-y-4">
					<li v-for="status in statuses" :key="status.label" class="flex items-start gap-3">
						<span :class="['pill', status.pill]">{{ status.label }}</span>
						<span class="text-sm text-frost-500">{{ status.text }}</span>
					</li>
				</ul>
			</div>
		</div>
	</section>
</template>
