import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/recupera-password",
    name: "reset-password",
    component: () => import("../views/ResetPassword.vue"),
  },
  { path: "/impostazioni", component: () => import("../views/Settings.vue") },
  { path: "/", name: "home", component: () => import("../views/Home.vue") },
  {
    path: "/nuova-segnalazione",
    name: "new-report",
    component: () => import("../views/NewReport.vue"),
  },
  { path: "/info", name: "info", component: () => import("../views/Info.vue") },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/moderazione",
    name: "moderation",
    component: () => import("../views/Moderation.vue"),
    meta: { requiresModerator: true },
  },
];

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_MODE === "hash"
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 };
  },
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresModerator) {
    const auth = useAuthStore();
    if (!auth.isModerator) {
      return { name: "login" };
    }
  }
});

export default router;
