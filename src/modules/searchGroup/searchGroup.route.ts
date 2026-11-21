import { Router } from "express";
import { searchGroupController } from "./searchGroup.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { deleteGroupValidationSchema } from "../lead/lead.validation";

const router = Router();

// GET /search-groups (supports query params: search, page, limit, sortBy)
router.get("/", searchGroupController.getSearchGroups);

// GET /search-groups/:groupId
router.get("/:groupId", searchGroupController.getSearchGroupById);

// DELETE /search-groups/:groupId
router.delete(
  "/:groupId",
  validateRequest(deleteGroupValidationSchema),
  searchGroupController.deleteSearchGroup,
);

export default router;
