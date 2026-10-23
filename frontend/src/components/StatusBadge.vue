<script setup lang="ts">
import type { VacationStatus } from "../api/types";

const props = defineProps<{ status: VacationStatus }>();

// Maps 1:1 onto the .pill-* classes in style.css.
const PILL_CLASS: Record<VacationStatus, string> = {
	Pending: "pill-pending",
	Approved: "pill-approved",
	Rejected: "pill-rejected",
};
</script>

<template>
	<span :class="['pill', PILL_CLASS[props.status]]">{{ props.status }}</span>
</template>
