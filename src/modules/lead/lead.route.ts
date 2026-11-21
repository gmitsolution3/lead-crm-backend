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

// Get all leads (paginated with search & filters)
router.get("/all", leadController.getLeads);
router.get("/paginated", leadController.getLeads);

// Get search groups, or paginated leads if query params are present
router.get("/", (req, res, next) => {
  if (
    req.query.page ||
    req.query.limit ||
    req.query.search ||
    req.query.groupId ||
    req.query.source ||
    req.query.websiteFilter ||
    req.query.sortBy
  ) {
    return leadController.getLeads(req, res, next);
  }
  return leadController.getSearchGroups(req, res, next);
});

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
