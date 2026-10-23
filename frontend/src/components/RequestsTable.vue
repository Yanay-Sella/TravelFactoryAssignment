<script setup lang="ts">
import type { VacationRequest } from "../api/types";
import StatusBadge from "./StatusBadge.vue";

// showRequester and the actions slot exist for the validator dashboard, which renders
// the same rows with a name column and per-row decisions.
const props = defineProps<{ requests: VacationRequest[]; showRequester?: boolean }>();

const dateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

// Dates arrive as plain "YYYY-MM-DD"; reading them as UTC keeps the day from shifting.
const formatDate = (value: string): string => dateFormat.format(new Date(`${value}T00:00:00Z`));
</script>

<template>
	<table class="w-full border-collapse text-left text-sm">
		<thead>
			<tr class="border-b border-frost-200 text-xs font-bold uppercase tracking-[0.12em] text-frost-500">
				<th v-if="props.showRequester" scope="col" class="pb-3 pr-4">Requester</th>
				<th scope="col" class="pb-3 pr-4">Dates</th>
				<th scope="col" class="hidden pb-3 pr-4 md:table-cell">Reason</th>
				<th scope="col" class="pb-3 pr-4">Status</th>
				<th v-if="$slots.actions" scope="col" class="pb-3 text-right">Decision</th>
			</tr>
		</thead>

		<tbody>
			<tr
				v-for="request in props.requests"
				:key="request.id"
				class="border-b border-frost-100 align-top last:border-0"
			>
				<td v-if="props.showRequester" class="py-4 pr-4 font-bold text-frost-900">
					{{ request.user?.name ?? "—" }}
				</td>

				<td class="py-4 pr-4">
					<span class="font-bold text-frost-900">{{ formatDate(request.startDate) }}</span>
					<span class="text-frost-400"> → </span>
					<span class="font-bold text-frost-900">{{ formatDate(request.endDate) }}</span>
					<span v-if="request.reason" class="mt-1 block text-frost-500 md:hidden">
						{{ request.reason }}
					</span>
				</td>

				<td class="hidden py-4 pr-4 text-frost-500 md:table-cell">{{ request.reason ?? "—" }}</td>

				<td class="py-4 pr-4">
					<StatusBadge :status="request.status" />
					<span v-if="request.comments" class="mt-1.5 block max-w-xs text-xs text-frost-500">
						{{ request.comments }}
					</span>
				</td>

				<td v-if="$slots.actions" class="py-4 text-right">
					<slot name="actions" :request="request" />
				</td>
			</tr>
		</tbody>
	</table>
</template>
