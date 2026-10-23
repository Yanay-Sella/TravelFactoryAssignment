<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 40 });
</script>

<template>
	<svg
		:width="size"
		:height="size"
		viewBox="0 0 48 48"
		fill="none"
		aria-hidden="true"
		class="shrink-0"
	>
		<rect width="48" height="48" rx="14" fill="url(#mark-sky)" />
		<circle cx="35" cy="14" r="5" fill="#fff" opacity="0.65" />
		<path d="M4 38 17 17l8 12 5-7 10 16z" fill="url(#mark-rock)" />
		<path d="M17 17l4.6 7.2a7 7 0 0 1-9.2 0z" fill="#fff" />
		<path d="M30 22l3 4.6a5 5 0 0 1-6 0z" fill="#fff" />
		<path d="M2 38h44a2 2 0 0 1 0 4H2a2 2 0 0 1 0-4z" fill="#fff" />
		<defs>
			<linearGradient id="mark-sky" x1="0" y1="0" x2="48" y2="48">
				<stop stop-color="#83cfff" />
				<stop offset="1" stop-color="#1f94f5" />
			</linearGradient>
			<linearGradient id="mark-rock" x1="24" y1="17" x2="24" y2="38">
				<stop stop-color="#0e4c8a" />
				<stop offset="1" stop-color="#113f71" />
			</linearGradient>
		</defs>
	</svg>
</template>
