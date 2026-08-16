import { asyncHandler } from "../middleware/errorHandler.js";
import * as orderService from "../services/order.service.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { order, clientSecret } =
    await orderService.createOrderWithPaymentIntent(req.user, req.body);

  res.status(201).json({
    message:
      process.env.PAYMENT_MODE === "mock" ?
        "Order created. Demo payment is ready."
      : "Order created. Complete payment to confirm.",
    order,
    clientSecret,
  });
});

export const simulateMockPayment = asyncHandler(async (req, res) => {
  const order = await orderService.simulateMockPayment(
    req.params.orderId,
    req.user,
  );

  res.status(200).json({
    message: "Demo payment successful. Order confirmed.",
    order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user);

  res.json({
    orders,
  });
});

export const getVendorOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getVendorOrders(req.user);

  res.json({
    orders,
  });
});
