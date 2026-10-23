import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import type { UserRole } from "../api/types";
import { useAuthStore } from "../stores/auth";

// Where each role belongs after signing in. A Validator has no /my-requests page
// because the API scopes that route to Requesters.
export const homeFor = (role: UserRole): string =>
	role === "Validator" ? "/dashboard" : "/my-requests";

const routes: RouteRecordRaw[] = [
	{
		path: "/login",
		name: "login",
		component: () => import("../views/LoginView.vue"),
		meta: { public: true },
	},
	{
		path: "/my-requests",
		name: "my-requests",
		component: () => import("../views/MyRequestsView.vue"),
		meta: { roles: ["Requester"] satisfies UserRole[] },
	},
	{
		path: "/dashboard",
		name: "dashboard",
		component: () => import("../views/ValidatorDashboardView.vue"),
		meta: { roles: ["Validator"] satisfies UserRole[] },
	},
	{
		path: "/team",
		name: "team",
		component: () => import("../views/TeamPlanningView.vue"),
		// No roles: team planning is open to everyone signed in.
	},
	{ path: "/", redirect: "/login" },
	{ path: "/:pathMatch(.*)*", redirect: "/login" },
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach(async (to) => {
	const auth = useAuthStore();

	if (!auth.ready) {
		await auth.restore();
	}

	if (!auth.isAuthenticated) {
		return to.meta.public ? true : { path: "/login" };
	}

	const role = auth.user!.role;

	// A signed-in user has no reason to see the login page.
	if (to.meta.public) {
		return homeFor(role);
	}

	const allowed = to.meta.roles as UserRole[] | undefined;
	return !allowed || allowed.includes(role) ? true : homeFor(role);
});
