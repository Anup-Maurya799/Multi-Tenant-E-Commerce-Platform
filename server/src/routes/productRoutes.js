import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { requireAuth, attachUserIfPresent } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";
import {
  createProductValidator,
  updateProductValidator,
  productIdParamValidator,
  imageIndexParamValidator,
  listProductsQueryValidator,
} from "../validators/product.validator.js";

const router = Router();

// Public — storefront browsing, with optional auth so an owner viewing
// their own unpublished product doesn't get a false 404.
router.get(
  "/",
  listProductsQueryValidator,
  validateRequest,
  productController.listProducts,
);
router.get(
  "/:productId",
  attachUserIfPresent,
  productIdParamValidator,
  validateRequest,
  productController.getProduct,
);

// Vendor-only — manage their own catalog (tenant isolation enforced in the service layer)
router.get(
  "/vendor/mine",
  requireAuth,
  authorize("vendor"),
  productController.listMyProducts,
);
router.post(
  "/",
  requireAuth,
  authorize("vendor"),
  createProductValidator,
  validateRequest,
  productController.createProduct,
);
router.patch(
  "/:productId",
  requireAuth,
  authorize("vendor", "superadmin"),
  productIdParamValidator,
  updateProductValidator,
  validateRequest,
  productController.updateProduct,
);
router.delete(
  "/:productId",
  requireAuth,
  authorize("vendor", "superadmin"),
  productIdParamValidator,
  validateRequest,
  productController.deleteProduct,
);

// Images — multer parses the multipart body BEFORE validators run, since
// express-validator can't inspect req.files until multer has populated it.
router.post(
  "/:productId/images",
  requireAuth,
  authorize("vendor", "superadmin"),
  productIdParamValidator,
  validateRequest,
  uploadProductImages,
  productController.uploadProductImages,
);
router.delete(
  "/:productId/images/:imageIndex",
  requireAuth,
  authorize("vendor", "superadmin"),
  imageIndexParamValidator,
  validateRequest,
  productController.deleteProductImage,
);

export default router;
