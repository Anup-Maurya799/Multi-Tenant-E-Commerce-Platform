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
 * Creates an Order (status: pending) and a matching Stripe PaymentIntent.
 * Every price and stock check happens here, server-side — the client sends
 * only productId/quantity/variantLabel, NEVER a price. Trusting a
 * client-supplied price is the single most common e-commerce security bug.
 *
 * One order = one store. A cart spanning multiple vendors must call this
 * once per store (the frontend's checkout page handles that split).
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
        `One of the products in your cart could not be found.`,
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

  // Stripe amounts are in the smallest currency unit (cents for USD).
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

  return { order, clientSecret: paymentIntent.client_secret };
}

/**
 * Decrements stock for every item on a now-paid order. Runs ONLY from the
 * webhook (i.e. only once payment is actually confirmed) — never at order
 * creation time, which would let abandoned/failed payments hold stock hostage.
 */
async function decrementStockForOrder(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue; // product may have been deleted since the order was placed

    if (item.variantLabel) {
      const variant = findVariant(product, item.variantLabel);
      if (variant) variant.stock = Math.max(0, variant.stock - item.quantity);
    } else {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
    await product.save();
  }
}

/**
 * Single entry point for every Stripe webhook event this app cares about.
 * Signature verification happens in the controller — by the time an event
 * reaches here, it's already confirmed to genuinely be from Stripe.
 */
export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      if (!order) return; // could be a PaymentIntent from a different flow/test — ignore, don't error

      // Idempotency guard: Stripe can and does deliver the same event more
      // than once. Without this check, a retried webhook would double-decrement stock.
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
      // Unhandled event types are expected and fine — Stripe sends many
      // event types this app doesn't act on yet (e.g. refund events, Week 4+).
      break;
  }
}

/**
 * A failed email must never undo a successful payment — if this throws,
 * we log it and move on rather than letting an SMTP hiccup roll back
 * the order status or stock decrement that already happened.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const customer = await User.findById(order.customer);
    if (!customer) return;

    await sendEmail({
      to: customer.email,
      subject: "Your Marketplace order is confirmed",
      html: orderConfirmationEmailTemplate({ name: customer.name, order }),
    });
  } catch (error) {
    console.error(
      `Failed to send order confirmation email for order ${order._id}:`,
      error.message,
    );
  }
}

export async function getMyOrders(customerUser) {
  return Order.find({ customer: customerUser._id }).sort({ createdAt: -1 });
}

export async function getVendorOrders(vendorUser) {
  if (!vendorUser.storeId) {
    throw new ApiError(400, "You don't have a store yet.");
  }
  return Order.find({ storeId: vendorUser.storeId }).sort({ createdAt: -1 });
}
