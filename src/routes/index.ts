import { Router } from "express";
import healthRoutes from "../modules/health/health.route";
import leadRoutes from "../modules/lead/lead.route";

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
    route: leadRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
