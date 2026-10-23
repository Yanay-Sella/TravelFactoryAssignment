<script setup lang="ts">
import { ref, watch } from "vue";
import type { VacationRequest } from "../api/types";

const props = defineProps<{ request: VacationRequest | null; submitting: boolean; error: string }>();
const emit = defineEmits<{
	(event: "cancel"): void;
	(event: "confirm", comments: string): void;
}>();

const comments = ref("");

// Each time a different request is opened, start from an empty comment.
watch(
	() => props.request?.id,
	() => {
		comments.value = "";
	}
);
</script>

<template>
	<div
		v-if="props.request"
		class="fixed inset-0 z-40 grid place-items-center bg-frost-900/40 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="reject-title"
	>
		<div class="card w-full max-w-lg animate-rise p-6 sm:p-8">
			<p class="eyebrow">Decision</p>
			<h2 id="reject-title" class="mt-2 text-2xl">Reject this request</h2>
			<p class="mt-2 text-sm text-frost-500">
				{{ props.request.user?.name ?? "This requester" }} will see your comment, so explain the
				reason.
			</p>

			<form class="mt-6 space-y-5" @submit.prevent="emit('confirm', comments)">
				<div class="space-y-1.5">
					<label for="rejectComments" class="field-label">Comment</label>
					<textarea
						id="rejectComments"
						v-model="comments"
						rows="3"
						required
						placeholder="Team is short-staffed that week…"
						class="field-input resize-y"
					></textarea>
				</div>

				<p
					v-if="props.error"
					role="alert"
					class="rounded-tile border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
				>
					{{ props.error }}
				</p>

				<div class="flex flex-wrap gap-3">
					<button
						type="submit"
						class="btn btn-primary"
						:disabled="props.submitting || comments.trim().length === 0"
					>
						{{ props.submitting ? "Rejecting…" : "Reject request" }}
					</button>
					<button type="button" class="btn btn-ghost" @click="emit('cancel')">Cancel</button>
				</div>
			</form>
		</div>
	</div>
</template>
