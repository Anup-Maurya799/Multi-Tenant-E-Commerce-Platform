import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.middleware.js";

const router = Router();

router.get(
  "/vendor",
  requireAuth,
  authorize("vendor"),
  analyticsController.getVendorAnalytics,
);
router.get(
  "/admin",
  requireAuth,
  authorize("superadmin"),
  analyticsController.getSuperAdminAnalytics,
);

export default router;
