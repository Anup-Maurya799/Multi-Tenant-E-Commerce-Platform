import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createOrderValidator } from "../validators/order.validator.js";

const router = Router();

/*
 * Create order
 */
router.post(
  "/",
  requireAuth,
  authorize("customer"),
  createOrderValidator,
  validateRequest,
  orderController.createOrder,
);

/*
 * Customer's orders
 */
router.get(
  "/mine",
  requireAuth,
  authorize("customer"),
  orderController.getMyOrders,
);

/*
 * Vendor's orders
 */
router.get(
  "/vendor/mine",
  requireAuth,
  authorize("vendor"),
  orderController.getVendorOrders,
);

/*
 * Demo payment
 *
 * POST /api/v1/orders/:orderId/simulate-payment
 */
router.post(
  "/:orderId/simulate-payment",
  requireAuth,
  authorize("customer"),
  orderController.simulateMockPayment,
);

export default router;
