import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { setUnauthorizedHandler } from "./api/client";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import "./style.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const auth = useAuthStore();

// A 401 from any request means the token is no longer good: drop it and sign out.
setUnauthorizedHandler(() => {
	auth.logout();
	router.replace("/login").catch(() => undefined);
});

// Mount once the first navigation has resolved, so the guard has restored the session
// and the header never flashes a signed-out state.
router.isReady().then(() => app.mount("#app"));
