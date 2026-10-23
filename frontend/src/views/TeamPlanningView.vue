<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage } from "../api/client";
import type { Paginated, VacationRequest } from "../api/types";
import MountainMark from "../components/MountainMark.vue";
import PageHero from "../components/PageHero.vue";
import Pagination from "../components/Pagination.vue";
import RequestsTable from "../components/RequestsTable.vue";

const PAGE_SIZE = 10;

const requests = ref<VacationRequest[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const loadError = ref("");

const load = async () => {
	loading.value = true;
	loadError.value = "";

	try {
		const { data } = await api.get<Paginated<VacationRequest>>("/vacation-requests/team", {
			params: { page: page.value, limit: PAGE_SIZE },
		});
		requests.value = data.data;
		total.value = data.total;
		totalPages.value = data.totalPages;
	} catch (caught) {
		loadError.value = errorMessage(caught, "Could not load the team calendar");
	} finally {
		loading.value = false;
	}
};

const changePage = async (next: number) => {
	page.value = next;
	await load();
};

onMounted(load);
</script>

<template>
	<section class="mx-auto max-w-6xl animate-rise space-y-6 px-4 py-8">
		<PageHero
			eyebrow="Team planning"
			title="Who is on the slopes"
			subtitle="Approved vacations across the team, earliest first, so you can plan around each other. Reasons stay private to the requester and their validator."
		>
			<template #aside>
				<div class="animate-float rounded-card bg-white/15 p-6 backdrop-blur-sm">
					<MountainMark :size="104" />
				</div>
			</template>
		</PageHero>

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Confirmed</p>
			<h2 class="mt-2 text-2xl">Approved vacations</h2>

			<p v-if="loading" class="mt-6 text-sm text-frost-500">Loading the team calendar…</p>

			<p
				v-else-if="loadError"
				role="alert"
				class="mt-6 rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
			>
				{{ loadError }}
			</p>

			<p v-else-if="total === 0" class="mt-6 text-sm text-frost-500">
				No approved vacations yet.
			</p>

			<template v-else>
				<div class="mt-6">
					<RequestsTable :requests="requests" show-requester />
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
	</section>
</template>
