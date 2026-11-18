import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { leadController } from "./lead.controller";
import {
  deleteGroupValidationSchema,
  deleteLeadValidationSchema,
  importLeadsValidationSchema,
  knownLeadsQueryValidationSchema,
  saveLeadValidationSchema,
  updateLeadRemarkValidationSchema,
} from "./lead.validation";

const router = Router();

// Get all leads (flat array)
router.get("/all", leadController.getLeads);

// Get all search groups with their leads
router.get("/", leadController.getSearchGroups);

// Save / merge an individual lead
router.post(
  "/save",
  validateRequest(saveLeadValidationSchema),
  leadController.saveLead,
);

// Compatibility route: POST / also saves lead
router.post(
  "/",
  validateRequest(saveLeadValidationSchema),
  leadController.saveLead,
);

// Update lead remark
router.patch(
  "/:leadId/remark",
  validateRequest(updateLeadRemarkValidationSchema),
  leadController.updateLeadRemark,
);

// Compatibility route for updating remark with group scope
router.patch(
  "/group/:groupId/lead/:leadId/remark",
  validateRequest(updateLeadRemarkValidationSchema),
  leadController.updateLeadRemark,
);

// Import multiple leads (e.g. CSV import)
router.post(
  "/import",
  validateRequest(importLeadsValidationSchema),
  leadController.importLeads,
);

// Get known leads metadata for query deduplication
router.get(
  "/known",
  validateRequest(knownLeadsQueryValidationSchema),
  leadController.getKnownLeadsForQuery,
);

// Clear all leads and groups
router.delete("/clear", leadController.clearAll);

// Delete specific lead from a group
router.delete(
  "/group/:groupId/lead/:leadId",
  validateRequest(deleteLeadValidationSchema),
  leadController.deleteLead,
);

// Delete entire search group
router.delete(
  "/group/:groupId",
  validateRequest(deleteGroupValidationSchema),
  leadController.deleteSearchGroup,
);

export default router;
