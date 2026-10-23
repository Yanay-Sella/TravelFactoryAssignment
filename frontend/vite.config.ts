import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// /api is proxied to the CEF dev server so the browser only ever talks to one origin.
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8888",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
