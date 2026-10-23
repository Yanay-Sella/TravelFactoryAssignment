<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { api, errorMessage } from "../api/client";
import type { Paginated, VacationRequest, VacationStatus } from "../api/types";
import MountainMark from "../components/MountainMark.vue";
import PageHero from "../components/PageHero.vue";
import Pagination from "../components/Pagination.vue";
import RequestsTable from "../components/RequestsTable.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const PAGE_SIZE = 10;

const requests = ref<VacationRequest[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const loadError = ref("");

const formOpen = ref(false);
const startDate = ref("");
const endDate = ref("");
const reason = ref("");
const submitting = ref(false);
const formError = ref("");

const today = new Date().toISOString().slice(0, 10);

// Editing the form clears the previous failure, so a stale message never sits under
// inputs the user has already changed.
watch([startDate, endDate, reason], () => {
	formError.value = "";
});

const legend: { status: VacationStatus; text: string }[] = [
	{ status: "Pending", text: "Waiting for a validator to review it." },
	{ status: "Approved", text: "Your days off are confirmed." },
	{ status: "Rejected", text: "Check the comment for the reason." },
];

const load = async () => {
	loading.value = true;
	loadError.value = "";

	try {
		const { data } = await api.get<Paginated<VacationRequest>>("/vacation-requests", {
			params: { page: page.value, limit: PAGE_SIZE },
		});
		requests.value = data.data;
		total.value = data.total;
		totalPages.value = data.totalPages;
	} catch (caught) {
		loadError.value = errorMessage(caught, "Could not load your requests");
	} finally {
		loading.value = false;
	}
};

const changePage = async (next: number) => {
	page.value = next;
	await load();
};

const toggleForm = () => {
	formOpen.value = !formOpen.value;
	formError.value = "";

	if (!formOpen.value) {
		startDate.value = "";
		endDate.value = "";
		reason.value = "";
	}
};

const submit = async () => {
	formError.value = "";

	// A local check for immediate feedback; the server still enforces every rule.
	if (endDate.value <= startDate.value) {
		formError.value = "End date must be after start date";
		return;
	}

	submitting.value = true;

	try {
		await api.post("/vacation-requests", {
			startDate: startDate.value,
			endDate: endDate.value,
			reason: reason.value.trim() || null,
		});

		toggleForm();
		page.value = 1;
		await load();
	} catch (caught) {
		formError.value = errorMessage(caught, "Could not submit your request");
	} finally {
		submitting.value = false;
	}
};

onMounted(load);
</script>

<template>
	<section class="mx-auto max-w-6xl animate-rise space-y-6 px-4 py-8">
		<PageHero
			eyebrow="My requests"
			:title="`Hey ${auth.user?.name ?? 'there'}!`"
			:subtitle="`Signed in as ${auth.user?.email} · ${auth.user?.role}. Plan your trip, send a request, and follow it all the way to approval.`"
		>
			<template #actions>
				<button
					type="button"
					:class="['btn', formOpen ? 'btn-ghost' : 'btn-primary']"
					@click="toggleForm"
				>
					<svg
						v-if="!formOpen"
						viewBox="0 0 24 24"
						class="size-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
					{{ formOpen ? "Cancel" : "New request" }}
				</button>
			</template>

			<template #aside>
				<div class="animate-float rounded-card bg-white/15 p-6 backdrop-blur-sm">
					<MountainMark :size="104" />
				</div>
			</template>
		</PageHero>

		<div v-if="formOpen" class="card p-6 sm:p-8">
			<p class="eyebrow">New request</p>
			<h2 class="mt-2 text-2xl">Pick your dates</h2>

			<form class="mt-6 space-y-5" @submit.prevent="submit">
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-1.5">
						<label for="startDate" class="field-label">Start date</label>
						<input
							id="startDate"
							v-model="startDate"
							type="date"
							required
							:min="today"
							class="field-input"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="endDate" class="field-label">End date</label>
						<input
							id="endDate"
							v-model="endDate"
							type="date"
							required
							:min="startDate || today"
							class="field-input"
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<label for="reason" class="field-label">Reason <span class="font-normal text-frost-400">(optional)</span></label>
					<textarea
						id="reason"
						v-model="reason"
						rows="3"
						placeholder="Family trip, skiing, a long weekend…"
						class="field-input resize-y"
					/>
				</div>

				<p
					v-if="formError"
					role="alert"
					class="rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
				>
					{{ formError }}
				</p>

				<div class="flex flex-wrap gap-3">
					<button type="submit" :disabled="submitting" class="btn btn-primary">
						{{ submitting ? "Sending…" : "Send request" }}
					</button>
					<button type="button" class="btn btn-ghost" @click="toggleForm">Discard</button>
				</div>
			</form>
		</div>

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Trip board</p>
			<h2 class="mt-2 text-2xl">Your requests</h2>

			<p v-if="loading" class="mt-6 text-sm text-frost-500">Loading your requests…</p>

			<p
				v-else-if="loadError"
				role="alert"
				class="mt-6 rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
			>
				{{ loadError }}
			</p>

			<p v-else-if="total === 0" class="mt-6 text-sm text-frost-500">
				No requests yet. Use <span class="font-bold text-frost-700">New request</span> to send your
				first one.
			</p>

			<template v-else>
				<div class="mt-6">
					<RequestsTable :requests="requests" />
				</div>
				<div class="mt-6">
					<Pagination
						:page="page"
						:total-pages="totalPages"
						:total="total"
						@update:page="changePage"
					/>
				</div>
			</template>
		</div>

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Status key</p>
			<ul class="mt-4 grid gap-4 sm:grid-cols-3">
				<li v-for="entry in legend" :key="entry.status" class="flex items-start gap-3">
					<StatusBadge :status="entry.status" />
					<span class="text-sm text-frost-500">{{ entry.text }}</span>
				</li>
			</ul>
		</div>
	</section>
</template>
