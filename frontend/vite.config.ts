import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// The API lives on localhost when run on a host, and at the service name under Compose.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8888";

// /api is proxied to the CEF dev server so the browser only ever talks to one origin.
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	server: {
		host: true,
		proxy: {
			"/api": {
				target: apiTarget,
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
