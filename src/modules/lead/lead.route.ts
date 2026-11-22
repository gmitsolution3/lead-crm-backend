import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { leadController } from "./lead.controller";
import {
  addLeadNoteValidationSchema,
  deleteGroupValidationSchema,
  deleteLeadValidationSchema,
  importLeadsValidationSchema,
  knownLeadsQueryValidationSchema,
  saveLeadValidationSchema,
  updateLeadValidationSchema,
} from "./lead.validation";

const router = Router();

// Get all leads (paginated with search & filters)
router.get("/all", leadController.getLeads);
router.get("/paginated", leadController.getLeads);
router.get("/", leadController.getLeads);

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

// Update lead management details (status, priority, follow-up, dealValue, etc.)
router.patch(
  "/:leadId",
  validateRequest(updateLeadValidationSchema),
  leadController.updateLead,
);

// Delete lead directly by leadId
router.delete("/:leadId", leadController.deleteLead);

// Add note to lead timeline
router.post(
  "/:leadId/notes",
  validateRequest(addLeadNoteValidationSchema),
  leadController.addLeadNote,
);

// Delete note from lead timeline
router.delete(
  "/:leadId/notes/:noteId",
  leadController.deleteLeadNote,
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
