import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { settingsController } from "./settings.controller";
import { updateSettingsValidationSchema } from "./settings.validation";

const router = Router();

router.get("/", settingsController.getSettings);
router.patch(
  "/",
  validateRequest(updateSettingsValidationSchema),
  settingsController.updateSettings,
);

export default router;
