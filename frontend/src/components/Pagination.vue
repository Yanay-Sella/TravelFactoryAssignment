<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number; total: number }>();
const emit = defineEmits<{ (event: "update:page", page: number): void }>();

const go = (page: number) => {
	if (page >= 1 && page <= props.totalPages) {
		emit("update:page", page);
	}
};
</script>

<template>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-frost-500">
			Page {{ props.page }} of {{ props.totalPages }} · {{ props.total }}
			{{ props.total === 1 ? "request" : "requests" }}
		</p>

		<div v-if="props.totalPages > 1" class="flex gap-2">
			<button
				type="button"
				class="btn btn-ghost"
				:disabled="props.page <= 1"
				@click="go(props.page - 1)"
			>
				Previous
			</button>
			<button
				type="button"
				class="btn btn-ghost"
				:disabled="props.page >= props.totalPages"
				@click="go(props.page + 1)"
			>
				Next
			</button>
		</div>
	</div>
</template>
