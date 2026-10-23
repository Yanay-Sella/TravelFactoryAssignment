<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage } from "../api/client";
import type { Paginated, User, VacationRequest, VacationStatus } from "../api/types";
import MountainMark from "../components/MountainMark.vue";
import PageHero from "../components/PageHero.vue";
import Pagination from "../components/Pagination.vue";
import RejectModal from "../components/RejectModal.vue";
import RequestsTable from "../components/RequestsTable.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const PAGE_SIZE = 10;
const STATUSES: VacationStatus[] = ["Pending", "Approved", "Rejected"];

const requests = ref<VacationRequest[]>([]);
const users = ref<User[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const loadError = ref("");

const statusFilter = ref<VacationStatus | "">("");
const userFilter = ref("");

const rejecting = ref<VacationRequest | null>(null);
const deciding = ref(false);
const decisionError = ref("");

const load = async () => {
	loading.value = true;
	loadError.value = "";

	try {
		const { data } = await api.get<Paginated<VacationRequest>>("/vacation-requests/all", {
			params: {
				page: page.value,
				limit: PAGE_SIZE,
				status: statusFilter.value || undefined,
				userId: userFilter.value || undefined,
			},
		});
		requests.value = data.data;
		total.value = data.total;
		totalPages.value = data.totalPages;
	} catch (caught) {
		loadError.value = errorMessage(caught, "Could not load the request queue");
	} finally {
		loading.value = false;
	}
};

const applyFilters = async () => {
	page.value = 1;
	await load();
};

const clearFilters = async () => {
	statusFilter.value = "";
	userFilter.value = "";
	await applyFilters();
};

const changePage = async (next: number) => {
	page.value = next;
	await load();
};

const approve = async (request: VacationRequest) => {
	decisionError.value = "";
	deciding.value = true;

	try {
		await api.patch(`/vacation-requests/${request.id}/approve`);
		await load();
	} catch (caught) {
		loadError.value = errorMessage(caught, "Could not approve the request");
	} finally {
		deciding.value = false;
	}
};

const reject = async (comments: string) => {
	if (!rejecting.value) return;

	decisionError.value = "";
	deciding.value = true;

	try {
		await api.patch(`/vacation-requests/${rejecting.value.id}/reject`, { comments });
		rejecting.value = null;
		await load();
	} catch (caught) {
		decisionError.value = errorMessage(caught, "Could not reject the request");
	} finally {
		deciding.value = false;
	}
};

const loadUsers = async () => {
	try {
		const { data } = await api.get<{ users: User[] }>("/users");
		users.value = data.users;
	} catch {
		// The queue still works without the filter list; the control simply stays empty.
	}
};

// Both in flight at once, so the filter is ready as soon as the queue is.
onMounted(() => {
	void load();
	void loadUsers();
});
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

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Filters</p>
			<h2 class="mt-2 text-2xl">Narrow the queue</h2>

			<div class="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
				<div class="space-y-1.5">
					<label for="statusFilter" class="field-label">Status</label>
					<select
						id="statusFilter"
						v-model="statusFilter"
						class="field-input"
						@change="applyFilters"
					>
						<option value="">All statuses</option>
						<option v-for="status in STATUSES" :key="status" :value="status">{{ status }}</option>
					</select>
				</div>

				<div class="space-y-1.5">
					<label for="userFilter" class="field-label">Requester</label>
					<select id="userFilter" v-model="userFilter" class="field-input" @change="applyFilters">
						<option value="">All requesters</option>
						<option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
					</select>
				</div>

				<button
					type="button"
					class="btn btn-ghost"
					:disabled="!statusFilter && !userFilter"
					@click="clearFilters"
				>
					Clear
				</button>
			</div>
		</div>

		<div class="card p-6 sm:p-8">
			<p class="eyebrow">Request queue</p>
			<h2 class="mt-2 text-2xl">All requests</h2>

			<p v-if="loading" class="mt-6 text-sm text-frost-500">Loading the queue…</p>

			<p
				v-else-if="loadError"
				role="alert"
				class="mt-6 rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
			>
				{{ loadError }}
			</p>

			<p v-else-if="total === 0" class="mt-6 text-sm text-frost-500">
				Nothing matches these filters.
			</p>

			<template v-else>
				<div class="mt-6">
					<RequestsTable :requests="requests" show-requester>
						<template #actions="{ request }">
							<div v-if="request.status === 'Pending'" class="flex justify-end gap-2">
								<button
									type="button"
									class="btn btn-ghost px-3 py-1.5 text-xs text-emerald-700 hover:text-emerald-800"
									:disabled="deciding"
									@click="approve(request)"
								>
									Approve
								</button>
								<button
									type="button"
									class="btn btn-ghost px-3 py-1.5 text-xs text-rose-700 hover:text-rose-800"
									:disabled="deciding"
									@click="rejecting = request"
								>
									Reject
								</button>
							</div>
							<span v-else class="text-xs text-frost-400">Decided</span>
						</template>
					</RequestsTable>
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

		<RejectModal
			:request="rejecting"
			:submitting="deciding"
			:error="decisionError"
			@cancel="rejecting = null"
			@confirm="reject"
		/>
	</section>
</template>
