import { Router } from "express";
import healthRoutes from "../modules/health/health.route";
import leadRoutes from "../modules/lead/lead.route";
import searchGroupRoutes from "../modules/searchGroup/searchGroup.route";
import settingsRoutes from "../modules/settings/settings.route";
import dashboardRoutes from "../modules/dashboard/dashboard.route";

const router = Router();

const moduleRoutes: {
  path: string;
  route: Router;
}[] = [
  {
    path: "/health",
    route: healthRoutes,
  },
  {
    path: "/leads",
    route: leadRoutes,
  },
  {
    path: "/search-groups",
    route: searchGroupRoutes,
  },
  {
    path: "/settings",
    route: settingsRoutes,
  },
  {
    path: "/dashboard",
    route: dashboardRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
