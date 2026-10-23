<script setup lang="ts">
// Purely decorative alpine scene behind every screen: sky, clouds, gondola, peaks.
const clouds = [
	{ class: "left-[4%] top-[8%] w-28 sm:w-40", delay: "0s", opacity: 0.9 },
	{ class: "right-[10%] top-[16%] w-24 sm:w-32", delay: "1.6s", opacity: 0.75 },
	{ class: "left-[42%] top-[3%] hidden w-24 lg:block", delay: "3.2s", opacity: 0.6 },
];

const pines = [
	{ x: 120, y: 505, s: 1 },
	{ x: 205, y: 525, s: 0.72 },
	{ x: 1290, y: 512, s: 0.9 },
	{ x: 1370, y: 532, s: 0.65 },
	{ x: 680, y: 545, s: 0.8 },
];
</script>

<template>
	<div
		aria-hidden="true"
		class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-to-b from-powder-300 via-powder-100 to-frost-50"
	>
		<svg
			v-for="(cloud, index) in clouds"
			:key="index"
			:class="['absolute animate-float text-white', cloud.class]"
			:style="{ animationDelay: cloud.delay, opacity: cloud.opacity }"
			viewBox="0 0 120 60"
			fill="currentColor"
		>
			<circle cx="35" cy="34" r="18" />
			<circle cx="60" cy="26" r="24" />
			<circle cx="88" cy="36" r="16" />
			<rect x="30" y="38" width="62" height="16" rx="8" />
		</svg>

		<svg
			class="absolute right-0 top-10 hidden w-80 md:block"
			viewBox="0 0 320 160"
			fill="none"
		>
			<path d="M0 18 320 0" stroke="#0a5caa" stroke-width="3" opacity="0.4" />
			<g class="animate-sway origin-[150px_12px]">
				<path d="M150 12v16" stroke="#0a5caa" stroke-width="3" />
				<rect x="126" y="28" width="48" height="38" rx="12" fill="#f55a1e" />
				<rect x="134" y="36" width="32" height="18" rx="7" fill="#d9efff" />
			</g>
			<g class="animate-sway origin-[262px_6px]" style="animation-delay: 2.4s">
				<path d="M262 6v12" stroke="#0a5caa" stroke-width="3" />
				<rect x="244" y="18" width="36" height="28" rx="10" fill="#1f94f5" />
				<rect x="250" y="24" width="24" height="13" rx="5" fill="#eef8ff" />
			</g>
		</svg>

		<svg
			class="absolute inset-x-0 bottom-0 h-[55vh] w-full"
			viewBox="0 0 1440 600"
			preserveAspectRatio="xMidYMax slice"
			fill="none"
		>
			<path
				d="M0 430 220 290 420 430 620 300 860 440 1080 310 1300 440 1440 370V600H0z"
				fill="#b7e2ff"
			/>

			<path d="M60 520 380 250 700 520z" fill="url(#ridge-mid)" />
			<path d="M380 250 446 306 425 322 405 306 380 326 356 306 335 322 314 306z" fill="#fff" />

			<path d="M700 560 980 210 1280 560z" fill="url(#ridge-front)" />
			<path d="M980 210 1031 270 1012 287 992 271 970 290 950 271 932 287z" fill="#fff" />

			<path
				d="M0 480c200-40 380 20 620-10s480-40 820 20v110H0z"
				fill="#fff"
			/>

			<g v-for="(pine, index) in pines" :key="index" :transform="`translate(${pine.x} ${pine.y}) scale(${pine.s})`">
				<rect x="-4" y="-6" width="8" height="12" rx="3" fill="#0a5caa" />
				<path d="M0-52 15-24H8l12 22h-40l12-22h-7z" fill="#0e4c8a" />
				<path d="M0-52 8-37q-8 5-16 0z" fill="#fff" />
			</g>

			<defs>
				<linearGradient id="ridge-mid" x1="380" y1="250" x2="380" y2="520">
					<stop stop-color="#83cfff" />
					<stop offset="1" stop-color="#47b4ff" />
				</linearGradient>
				<linearGradient id="ridge-front" x1="980" y1="210" x2="980" y2="560">
					<stop stop-color="#47b4ff" />
					<stop offset="1" stop-color="#0b74d4" />
				</linearGradient>
			</defs>
		</svg>
	</div>
</template>
