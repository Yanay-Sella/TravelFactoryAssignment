<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; subtitle: string }>();
</script>

<template>
	<section
		class="relative overflow-hidden rounded-card bg-linear-to-br from-powder-700 via-powder-600 to-powder-500 px-6 py-8 text-white shadow-lift sm:px-10 sm:py-10"
	>
		<div class="absolute -right-16 -top-20 size-56 rounded-full bg-white/10" />
		<div class="absolute -bottom-24 right-24 size-48 rounded-full bg-white/10" />

		<div class="relative flex flex-wrap items-center gap-8">
			<div class="min-w-64 flex-1">
				<p class="eyebrow text-powder-100">{{ eyebrow }}</p>
				<h1 class="mt-2 text-3xl text-white sm:text-4xl">{{ title }}</h1>
				<p class="mt-3 max-w-xl text-sm text-powder-50/90 sm:text-base">{{ subtitle }}</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<slot name="actions" />
				</div>
			</div>

			<div class="hidden shrink-0 lg:block">
				<slot name="aside" />
			</div>
		</div>
	</section>
</template>
