import { Router } from "express";
import * as storeController from "../controllers/storeController.js";
import { requireAuth } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createStoreValidator,
  updateStoreValidator,
  storeIdParamValidator,
  storeSlugParamValidator,
} from "../validators/store.validator.js";

const router = Router();

// Public — anyone can browse the storefront directory
router.get("/", storeController.listStores);
router.get(
  "/slug/:slug",
  storeSlugParamValidator,
  validateRequest,
  storeController.getStoreBySlug,
);

// Vendor-only — create/view their own store
router.post(
  "/",
  requireAuth,
  authorize("vendor"),
  createStoreValidator,
  validateRequest,
  storeController.createStore,
);
router.get("/me", requireAuth, authorize("vendor"), storeController.getMyStore);

// Vendor (owner) or superadmin — update store details; ownership is
// re-checked inside store.service.js, not just via the role gate here.
router.patch(
  "/:storeId",
  requireAuth,
  authorize("vendor", "superadmin"),
  storeIdParamValidator,
  updateStoreValidator,
  validateRequest,
  storeController.updateStore,
);

export default router;
