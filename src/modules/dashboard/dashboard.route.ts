import { Router } from "express";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get("/admin", dashboardController.getAdminDashboard);
router.get("/moderator", dashboardController.getModeratorDashboard);

export default router;
