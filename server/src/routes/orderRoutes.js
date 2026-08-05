import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createOrderValidator } from "../validators/order.validator.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  authorize("customer"),
  createOrderValidator,
  validateRequest,
  orderController.createOrder,
);
router.get(
  "/mine",
  requireAuth,
  authorize("customer"),
  orderController.getMyOrders,
);
router.get(
  "/vendor/mine",
  requireAuth,
  authorize("vendor"),
  orderController.getVendorOrders,
);

export default router;
