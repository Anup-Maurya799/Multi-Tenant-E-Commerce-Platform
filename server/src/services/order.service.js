import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "../config/stripe.js";
import { ApiError } from "../utils/ApiError.js";
import {
  sendEmail,
  orderConfirmationEmailTemplate,
} from "../utils/sendEmail.js";

function findVariant(product, variantLabel) {
  if (!variantLabel) return null;

  return (
    product.variants.find(
      (v) => [v.size, v.color].filter(Boolean).join(" / ") === variantLabel,
    ) || null
  );
}

/**
 * Creates an order and optionally creates a Stripe PaymentIntent.
 *
 * PAYMENT_MODE=mock
 * -----------------
 * Stripe is NOT called.
 * The order is created with status "pending".
 * The frontend can then use the demo payment endpoint.
 *
 * PAYMENT_MODE=stripe
 * -------------------
 * A real Stripe PaymentIntent is created.
 */
export async function createOrderWithPaymentIntent(
  customerUser,
  { storeId, items },
) {
  const orderItems = [];
  let totalAmount = 0;

  for (const { productId, quantity, variantLabel } of items) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(
        404,
        "One of the products in your cart could not be found.",
      );
    }

    if (product.storeId.toString() !== storeId) {
      throw new ApiError(
        400,
        "All items in a single order must belong to the same store.",
      );
    }

    if (!product.isPublished) {
      throw new ApiError(400, `${product.name} is no longer available.`);
    }

    const variant = findVariant(product, variantLabel);

    if (variantLabel && !variant) {
      throw new ApiError(
        400,
        `Selected option for ${product.name} is no longer available.`,
      );
    }

    const availableStock = variant ? variant.stock : product.stock;

    if (availableStock < quantity) {
      throw new ApiError(
        400,
        `Not enough stock for ${product.name}. Only ${availableStock} left.`,
      );
    }

    const unitPrice = variant?.priceOverride ?? product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      variantLabel: variantLabel || null,
      quantity,
      unitPrice,
    });

    totalAmount += unitPrice * quantity;
  }

  const order = await Order.create({
    customer: customerUser._id,
    storeId,
    items: orderItems,
    totalAmount,
    status: "pending",
  });

  /*
   * MOCK PAYMENT MODE
   *
   * This is used for development/demo because a real Stripe
   * secret key is not available.
   */
  if (process.env.PAYMENT_MODE === "mock") {
    return {
      order,
      clientSecret: null,
    };
  }

  /*
   * REAL STRIPE MODE
   *
   * Only execute this when PAYMENT_MODE is not "mock".
   */
  if (!stripe) {
    throw new ApiError(
      500,
      "Stripe is not configured. Set STRIPE_SECRET_KEY or use PAYMENT_MODE=mock.",
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      storeId,
      customerId: customerUser._id.toString(),
    },
  });

  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    order,
    clientSecret: paymentIntent.client_secret,
  };
}

/**
 * Decrements stock after successful payment.
 */
async function decrementStockForOrder(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);

    if (!product) continue;

    if (item.variantLabel) {
      const variant = findVariant(product, item.variantLabel);

      if (variant) {
        variant.stock = Math.max(0, variant.stock - item.quantity);
      }
    } else {
      product.stock = Math.max(0, product.stock - item.quantity);
    }

    await product.save();
  }
}

/**
 * Sends order confirmation email.
 *
 * Email failure must never break a successful payment.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const customer = await User.findById(order.customer);

    if (!customer) return;

    await sendEmail({
      to: customer.email,
      subject: "Your Marketplace order is confirmed",
      html: orderConfirmationEmailTemplate({
        name: customer.name,
        order,
      }),
    });
  } catch (error) {
    console.error(
      `Failed to send order confirmation email for order ${order._id}:`,
      error.message,
    );
  }
}

/**
 * MOCK PAYMENT
 *
 * Used only when PAYMENT_MODE=mock.
 *
 * It simulates the successful payment confirmation that
 * would normally come from Stripe's webhook.
 */
export async function simulateMockPayment(orderId, customerUser) {
  if (process.env.PAYMENT_MODE !== "mock") {
    throw new ApiError(403, "Mock payment is disabled.");
  }

  const order = await Order.findOne({
    _id: orderId,
    customer: customerUser._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  /*
   * Idempotency:
   * If the order is already paid, don't decrease stock again.
   */
  if (order.status === "paid") {
    return order;
  }

  if (order.status !== "pending") {
    throw new ApiError(
      400,
      `This order cannot be paid because its current status is "${order.status}".`,
    );
  }

  // Mark payment as successful.
  order.status = "paid";

  await order.save();

  // Decrease product stock only after successful payment.
  await decrementStockForOrder(order);

  // Send confirmation email.
  await sendOrderConfirmationEmail(order);

  return order;
}

/**
 * Handles Stripe webhook events when real Stripe is used.
 */
export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (!order) return;

      // Prevent duplicate stock decrement.
      if (order.status === "paid") return;

      order.status = "paid";

      await order.save();

      await decrementStockForOrder(order);

      await sendOrderConfirmationEmail(order);

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (order && order.status === "pending") {
        order.status = "cancelled";

        await order.save();
      }

      break;
    }

    default:
      break;
  }
}

export async function getMyOrders(customerUser) {
  return Order.find({
    customer: customerUser._id,
  }).sort({
    createdAt: -1,
  });
}

export async function getVendorOrders(vendorUser) {
  if (!vendorUser.storeId) {
    throw new ApiError(400, "You don't have a store yet.");
  }

  return Order.find({
    storeId: vendorUser.storeId,
  }).sort({
    createdAt: -1,
  });
}
